import { Router } from "express";
import { eq, and } from "drizzle-orm";
import { db, demoAccountsTable, tradesTable } from "@workspace/db";
import { requireAuth, type AuthRequest } from "../middlewares/auth.js";
import { getPrice } from "../lib/market.js";

const router = Router();

const formatTrade = (t: typeof tradesTable.$inferSelect) => ({
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
});

router.get("/demo/account", requireAuth, async (req: AuthRequest, res) => {
  try {
    const [demo] = await db.select().from(demoAccountsTable)
      .where(eq(demoAccountsTable.userId, req.userId!));
    if (!demo) {
      res.status(404).json({ error: "Demo account not found" });
      return;
    }
    const winRate = demo.totalTrades > 0
      ? (demo.winTrades / demo.totalTrades) * 100
      : 0;
    res.json({
      id: demo.id,
      balance: demo.balance,
      totalProfit: demo.totalProfit,
      totalTrades: demo.totalTrades,
      winRate: parseFloat(winRate.toFixed(1)),
    });
  } catch (err) {
    req.log?.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/demo/trade", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { pair, side, amount, stopLoss, takeProfit } = req.body;
    if (!pair || !side || !amount) {
      res.status(400).json({ error: "pair, side, amount required" });
      return;
    }

    const [demo] = await db.select().from(demoAccountsTable)
      .where(eq(demoAccountsTable.userId, req.userId!));
    if (!demo) {
      res.status(404).json({ error: "Demo account not found" });
      return;
    }
    if (demo.balance < amount) {
      res.status(400).json({ error: "Insufficient demo balance" });
      return;
    }

    const entryPrice = getPrice(pair);
    const [trade] = await db.insert(tradesTable).values({
      userId: req.userId!,
      pair,
      side,
      entryPrice,
      amount,
      stopLoss: stopLoss ?? null,
      takeProfit: takeProfit ?? null,
      status: "OPEN",
      type: "DEMO",
    }).returning();

    // Deduct from demo balance
    await db.update(demoAccountsTable)
      .set({ balance: demo.balance - amount })
      .where(eq(demoAccountsTable.userId, req.userId!));

    res.status(201).json(formatTrade(trade));
  } catch (err) {
    req.log?.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/demo/trades", requireAuth, async (req: AuthRequest, res) => {
  try {
    const trades = await db.select().from(tradesTable)
      .where(and(
        eq(tradesTable.userId, req.userId!),
        eq(tradesTable.type, "DEMO"),
      ));
    res.json(trades.map(formatTrade));
  } catch (err) {
    req.log?.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/demo/trades/:id/close", requireAuth, async (req: AuthRequest, res) => {
  try {
    const tradeId = parseInt(req.params.id as string);
    const [trade] = await db.select().from(tradesTable)
      .where(and(
        eq(tradesTable.id, tradeId),
        eq(tradesTable.userId, req.userId!),
        eq(tradesTable.type, "DEMO"),
        eq(tradesTable.status, "OPEN"),
      ));
    if (!trade) {
      res.status(404).json({ error: "Trade not found or already closed" });
      return;
    }

    const exitPrice = getPrice(trade.pair);
    const priceDiff = exitPrice - trade.entryPrice;
    const profit = trade.side === "BUY"
      ? (priceDiff / trade.entryPrice) * trade.amount
      : (-priceDiff / trade.entryPrice) * trade.amount;

    const [closed] = await db.update(tradesTable).set({
      exitPrice,
      profit: parseFloat(profit.toFixed(2)),
      status: "CLOSED",
      closedAt: new Date(),
    }).where(eq(tradesTable.id, tradeId)).returning();

    // Update demo account
    const [demo] = await db.select().from(demoAccountsTable)
      .where(eq(demoAccountsTable.userId, req.userId!));
    if (demo) {
      const isWin = profit > 0;
      await db.update(demoAccountsTable).set({
        balance: parseFloat((demo.balance + trade.amount + profit).toFixed(2)),
        totalProfit: parseFloat((demo.totalProfit + profit).toFixed(2)),
        totalTrades: demo.totalTrades + 1,
        winTrades: demo.winTrades + (isWin ? 1 : 0),
      }).where(eq(demoAccountsTable.userId, req.userId!));
    }

    res.json(formatTrade(closed));
  } catch (err) {
    req.log?.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
