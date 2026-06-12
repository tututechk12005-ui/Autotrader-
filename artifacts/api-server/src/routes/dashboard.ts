import { Router } from "express";
import { eq, and, gte, count, sum } from "drizzle-orm";
import { db, demoAccountsTable, tradesTable, settingsTable } from "@workspace/db";
import { requireAuth, type AuthRequest } from "../middlewares/auth.js";

const router = Router();

router.get("/dashboard/stats", requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const now = new Date();
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [demo] = await db.select().from(demoAccountsTable).where(eq(demoAccountsTable.userId, userId));
    const [settings] = await db.select().from(settingsTable).where(eq(settingsTable.userId, userId));

    const allTrades = await db.select().from(tradesTable).where(eq(tradesTable.userId, userId));
    const closedTrades = allTrades.filter(t => t.status === "CLOSED");
    const openTrades = allTrades.filter(t => t.status === "OPEN");

    const winTrades = closedTrades.filter(t => (t.profit ?? 0) > 0);
    const winRate = closedTrades.length > 0 ? (winTrades.length / closedTrades.length) * 100 : 0;

    const dayTrades = closedTrades.filter(t => t.closedAt && new Date(t.closedAt) >= dayStart);
    const monthTrades = closedTrades.filter(t => t.closedAt && new Date(t.closedAt) >= monthStart);

    const dailyProfit = dayTrades.reduce((s, t) => s + (t.profit ?? 0), 0);
    const monthlyProfit = monthTrades.reduce((s, t) => s + (t.profit ?? 0), 0);

    const totalProfit = closedTrades.filter(t => (t.profit ?? 0) > 0).reduce((s, t) => s + (t.profit ?? 0), 0);
    const totalLoss = Math.abs(closedTrades.filter(t => (t.profit ?? 0) < 0).reduce((s, t) => s + (t.profit ?? 0), 0));
    const profitFactor = totalLoss > 0 ? totalProfit / totalLoss : totalProfit > 0 ? 99 : 0;

    res.json({
      totalBalance: demo?.balance ?? 10000,
      dailyProfit: parseFloat(dailyProfit.toFixed(2)),
      monthlyProfit: parseFloat(monthlyProfit.toFixed(2)),
      winRate: parseFloat(winRate.toFixed(1)),
      activeTrades: openTrades.length,
      totalTrades: allTrades.length,
      profitFactor: parseFloat(profitFactor.toFixed(2)),
      botActive: settings?.botActive ?? false,
      demoBalance: demo?.balance ?? 10000,
    });
  } catch (err) {
    req.log?.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
