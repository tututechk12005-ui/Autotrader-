import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable, referralsTable } from "@workspace/db";
import { requireAuth, type AuthRequest } from "../middlewares/auth.js";

const router = Router();

router.get("/referral", requireAuth, async (req: AuthRequest, res) => {
  try {
    const [user] = await db.select().from(usersTable)
      .where(eq(usersTable.id, req.userId!));
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const refs = await db.select({
      id: referralsTable.id,
      referredUserId: referralsTable.referredUserId,
      commission: referralsTable.commission,
      createdAt: referralsTable.createdAt,
    }).from(referralsTable).where(eq(referralsTable.referrerId, req.userId!));

    // Get referred user usernames
    const refEntries = await Promise.all(refs.map(async (r) => {
      const [ru] = await db.select({ username: usersTable.username })
        .from(usersTable).where(eq(usersTable.id, r.referredUserId));
      return {
        id: r.id,
        username: ru?.username ?? "Unknown",
        joinedAt: r.createdAt.toISOString(),
        commission: r.commission,
      };
    }));

    const totalEarnings = refs.reduce((s, r) => s + r.commission, 0);

    res.json({
      referralCode: user.referralCode ?? "",
      totalReferrals: refs.length,
      totalEarnings: parseFloat(totalEarnings.toFixed(2)),
      referrals: refEntries,
    });
  } catch (err) {
    req.log?.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
