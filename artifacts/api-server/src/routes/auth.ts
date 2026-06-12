import { Router } from "express";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db, usersTable, demoAccountsTable, settingsTable } from "@workspace/db";
import { signToken } from "../lib/jwt.js";
import { requireAuth, type AuthRequest } from "../middlewares/auth.js";
import { randomBytes } from "crypto";

const router = Router();

router.post("/auth/register", async (req, res) => {
  try {
    const { email, password, username, referralCode } = req.body;
    if (!email || !password || !username) {
      res.status(400).json({ error: "Email, password, and username required" });
      return;
    }

    const existing = await db.select().from(usersTable)
      .where(eq(usersTable.email, email)).limit(1);
    if (existing.length > 0) {
      res.status(400).json({ error: "Email already registered" });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const myReferralCode = randomBytes(4).toString("hex").toUpperCase();

    let referredBy: number | null = null;
    if (referralCode) {
      const referrer = await db.select().from(usersTable)
        .where(eq(usersTable.referralCode, referralCode)).limit(1);
      if (referrer.length > 0) referredBy = referrer[0].id;
    }

    const [user] = await db.insert(usersTable).values({
      email,
      username,
      passwordHash,
      role: "user",
      isActive: true,
      referralCode: myReferralCode,
      referredBy: referredBy ?? undefined,
    }).returning();

    // Create demo account
    await db.insert(demoAccountsTable).values({ userId: user.id, balance: 10000 });
    // Create default settings
    await db.insert(settingsTable).values({ userId: user.id });

    const token = signToken({ userId: user.id, role: user.role });
    res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        isActive: user.isActive,
        referralCode: user.referralCode,
        createdAt: user.createdAt.toISOString(),
      },
    });
  } catch (err) {
    req.log?.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: "Email and password required" });
      return;
    }

    const [user] = await db.select().from(usersTable)
      .where(eq(usersTable.email, email)).limit(1);
    if (!user) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    if (!user.isActive) {
      res.status(401).json({ error: "Account disabled" });
      return;
    }

    const token = signToken({ userId: user.id, role: user.role });
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        isActive: user.isActive,
        referralCode: user.referralCode,
        createdAt: user.createdAt.toISOString(),
      },
    });
  } catch (err) {
    req.log?.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/auth/me", requireAuth, async (req: AuthRequest, res) => {
  try {
    const [user] = await db.select().from(usersTable)
      .where(eq(usersTable.id, req.userId!)).limit(1);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json({
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      isActive: user.isActive,
      referralCode: user.referralCode,
      createdAt: user.createdAt.toISOString(),
    });
  } catch (err) {
    req.log?.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
