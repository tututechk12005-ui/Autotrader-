import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, settingsTable } from "@workspace/db";
import { requireAuth, type AuthRequest } from "../middlewares/auth.js";

const router = Router();

router.get("/settings", requireAuth, async (req: AuthRequest, res) => {
  try {
    const [s] = await db.select().from(settingsTable)
      .where(eq(settingsTable.userId, req.userId!));
    if (!s) {
      res.status(404).json({ error: "Settings not found" });
      return;
    }
    res.json({
      id: s.id,
      riskPercent: s.riskPercent,
      stopLossPercent: s.stopLossPercent,
      takeProfitPercent: s.takeProfitPercent,
      dailyDrawdownPercent: s.dailyDrawdownPercent,
      maxOpenTrades: s.maxOpenTrades,
      strategy: s.strategy,
    });
  } catch (err) {
    req.log?.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/settings", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { riskPercent, stopLossPercent, takeProfitPercent, dailyDrawdownPercent, maxOpenTrades, strategy } = req.body;
    const [updated] = await db.update(settingsTable).set({
      ...(riskPercent !== undefined && { riskPercent }),
      ...(stopLossPercent !== undefined && { stopLossPercent }),
      ...(takeProfitPercent !== undefined && { takeProfitPercent }),
      ...(dailyDrawdownPercent !== undefined && { dailyDrawdownPercent }),
      ...(maxOpenTrades !== undefined && { maxOpenTrades }),
      ...(strategy !== undefined && { strategy }),
    }).where(eq(settingsTable.userId, req.userId!)).returning();
    res.json({
      id: updated.id,
      riskPercent: updated.riskPercent,
      stopLossPercent: updated.stopLossPercent,
      takeProfitPercent: updated.takeProfitPercent,
      dailyDrawdownPercent: updated.dailyDrawdownPercent,
      maxOpenTrades: updated.maxOpenTrades,
      strategy: updated.strategy,
    });
  } catch (err) {
    req.log?.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
