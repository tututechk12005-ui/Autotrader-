import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, apiKeysTable } from "@workspace/db";
import { requireAuth, type AuthRequest } from "../middlewares/auth.js";
import { encrypt, decrypt, maskKey } from "../lib/crypto.js";

const router = Router();

router.get("/binance/keys", requireAuth, async (req: AuthRequest, res) => {
  try {
    const [key] = await db.select().from(apiKeysTable)
      .where(eq(apiKeysTable.userId, req.userId!));
    if (!key) {
      res.json({ hasKeys: false, apiKeyMasked: null });
      return;
    }
    const apiKey = decrypt(key.apiKeyEncrypted);
    res.json({ hasKeys: true, apiKeyMasked: maskKey(apiKey) });
  } catch (err) {
    req.log?.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/binance/keys", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { apiKey, secretKey } = req.body;
    if (!apiKey || !secretKey) {
      res.status(400).json({ error: "API key and secret required" });
      return;
    }
    const apiKeyEncrypted = encrypt(apiKey);
    const secretKeyEncrypted = encrypt(secretKey);

    const existing = await db.select().from(apiKeysTable)
      .where(eq(apiKeysTable.userId, req.userId!));
    if (existing.length > 0) {
      await db.update(apiKeysTable).set({ apiKeyEncrypted, secretKeyEncrypted })
        .where(eq(apiKeysTable.userId, req.userId!));
    } else {
      await db.insert(apiKeysTable).values({
        userId: req.userId!,
        apiKeyEncrypted,
        secretKeyEncrypted,
      });
    }
    res.json({ hasKeys: true, apiKeyMasked: maskKey(apiKey) });
  } catch (err) {
    req.log?.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/binance/keys", requireAuth, async (req: AuthRequest, res) => {
  try {
    await db.delete(apiKeysTable).where(eq(apiKeysTable.userId, req.userId!));
    res.status(204).send();
  } catch (err) {
    req.log?.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/binance/balance", requireAuth, async (req: AuthRequest, res) => {
  try {
    const [key] = await db.select().from(apiKeysTable)
      .where(eq(apiKeysTable.userId, req.userId!));
    if (!key) {
      // Return simulated balance when no keys connected
      res.json({
        totalUsdt: 0,
        assets: [],
      });
      return;
    }
    // With real Binance API: use ccxt or binance SDK
    // For now return simulated data
    res.json({
      totalUsdt: 1250.50,
      assets: [
        { asset: "USDT", free: 1000.50, locked: 0 },
        { asset: "BTC", free: 0.003, locked: 0 },
        { asset: "ETH", free: 0.07, locked: 0 },
      ],
    });
  } catch (err) {
    req.log?.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
