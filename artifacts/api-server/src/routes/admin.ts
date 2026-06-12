import { Router } from "express";
import { eq, count } from "drizzle-orm";
import { db, usersTable, tradesTable, signalsTable, settingsTable } from "@workspace/db";
import { requireAdmin, type AuthRequest } from "../middlewares/auth.js";

const router = Router();

router.get("/admin/users", requireAdmin, async (req: AuthRequest, res) => {
  try {
    const users = await db.select().from(usersTable);
    res.json(users.map(u => ({
      id: u.id,
      email: u.email,
      username: u.username,
      role: u.role,
      isActive: u.isActive,
      referralCode: u.referralCode,
      createdAt: u.createdAt.toISOString(),
    })));
  } catch (err) {
    req.log?.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/admin/users/:id/toggle", requireAdmin, async (req: AuthRequest, res) => {
  try {
    const userId = parseInt(req.params.id as string);
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    const [updated] = await db.update(usersTable)
      .set({ isActive: !user.isActive })
      .where(eq(usersTable.id, userId))
      .returning();
    res.json({
      id: updated.id,
      email: updated.email,
      username: updated.username,
      role: updated.role,
      isActive: updated.isActive,
      referralCode: updated.referralCode,
      createdAt: updated.createdAt.toISOString(),
    });
  } catch (err) {
    req.log?.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/admin/trades", requireAdmin, async (req: AuthRequest, res) => {
  try {
    const trades = await db.select().from(tradesTable);
    res.json(trades.map(t => ({
      id: t.id,
      pair: t.pair,
      side: t.side,
      entryPrice: t.entryPrice,
      exitPrice: t.exitPrice,
      amount: t.amount,
      profit: t.profit,
      stopLoss: t.stopLoss,
      takeProfit: t.takeProfit,
      status: t.status,
      type: t.type,
      createdAt: t.createdAt.toISOString(),
      closedAt: t.closedAt?.toISOString() ?? null,
    })));
  } catch (err) {
    req.log?.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/admin/signals", requireAdmin, async (req: AuthRequest, res) => {
  try {
    const signals = await db.select().from(signalsTable);
    res.json(signals.map(s => ({
      id: s.id,
      pair: s.pair,
      action: s.action,
      confidence: s.confidence,
      entryPrice: s.entryPrice,
      stopLoss: s.stopLoss,
      takeProfit: s.takeProfit,
      indicators: s.indicators,
      strategy: s.strategy,
      createdAt: s.createdAt.toISOString(),
    })));
  } catch (err) {
    req.log?.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/admin/stats", requireAdmin, async (req: AuthRequest, res) => {
  try {
    const users = await db.select().from(usersTable);
    const trades = await db.select().from(tradesTable);
    const signals = await db.select().from(signalsTable);
    const settings = await db.select().from(settingsTable);

    const activeUsers = users.filter(u => u.isActive).length;
    const closedTrades = trades.filter(t => t.status === "CLOSED");
    const platformPnl = closedTrades.reduce((s, t) => s + (t.profit ?? 0), 0);
    const botsActive = settings.filter(s => s.botActive).length;

    res.json({
      totalUsers: users.length,
      activeUsers,
      totalTrades: trades.length,
      totalSignals: signals.length,
      platformPnl: parseFloat(platformPnl.toFixed(2)),
      botGlobalActive: botsActive > 0,
    });
  } catch (err) {
    req.log?.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
