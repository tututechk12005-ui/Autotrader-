import { Router } from "express";
import { db, signalsTable } from "@workspace/db";
import { requireAuth, type AuthRequest } from "../middlewares/auth.js";
import { analyzeMarket, PAIRS } from "../lib/market.js";
import { desc } from "drizzle-orm";

const router = Router();

const formatSignal = (s: typeof signalsTable.$inferSelect) => ({
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
});

router.get("/signals", requireAuth, async (req: AuthRequest, res) => {
  try {
    const signals = await db.select().from(signalsTable)
      .orderBy(desc(signalsTable.createdAt))
      .limit(50);
    res.json(signals.map(formatSignal));
  } catch (err) {
    req.log?.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/signals/generate", requireAuth, async (req: AuthRequest, res) => {
  try {
    const generated = [];
    for (const pair of PAIRS) {
      const analysis = analyzeMarket(pair);
      const [signal] = await db.insert(signalsTable).values({
        pair,
        action: analysis.action,
        confidence: analysis.confidence,
        entryPrice: analysis.entryPrice,
        stopLoss: analysis.stopLoss,
        takeProfit: analysis.takeProfit,
        indicators: analysis.indicators,
        strategy: "TREND_FOLLOWING",
      }).returning();
      generated.push(signal);
    }
    res.json(generated.map(formatSignal));
  } catch (err) {
    req.log?.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
