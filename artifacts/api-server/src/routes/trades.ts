import { Router } from "express";
import { eq, and } from "drizzle-orm";
import { db, tradesTable } from "@workspace/db";
import { requireAuth, type AuthRequest } from "../middlewares/auth.js";

const router = Router();

router.get("/trades", requireAuth, async (req: AuthRequest, res) => {
  try {
    const trades = await db.select().from(tradesTable)
      .where(and(
        eq(tradesTable.userId, req.userId!),
        eq(tradesTable.type, "REAL"),
      ));
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

export default router;
