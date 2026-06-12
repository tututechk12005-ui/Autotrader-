import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, settingsTable } from "@workspace/db";
import { requireAuth, requireAdmin, type AuthRequest } from "../middlewares/auth.js";

const router = Router();

router.get("/bot/status", requireAuth, async (req: AuthRequest, res) => {
  try {
    const [settings] = await db.select().from(settingsTable)
      .where(eq(settingsTable.userId, req.userId!));
    res.json({
      active: settings?.botActive ?? false,
      strategy: settings?.botStrategy ?? "TREND_FOLLOWING",
      totalRuntime: settings?.botRuntime ?? 0,
      tradesExecuted: 0,
    });
  } catch (err) {
    req.log?.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/bot/toggle", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { active, strategy } = req.body;
    const [settings] = await db.select().from(settingsTable)
      .where(eq(settingsTable.userId, req.userId!));
    if (!settings) {
      res.status(404).json({ error: "Settings not found" });
      return;
    }
    const [updated] = await db.update(settingsTable).set({
      botActive: active,
      botStrategy: strategy ?? settings.botStrategy,
    }).where(eq(settingsTable.userId, req.userId!)).returning();
    res.json({
      active: updated.botActive,
      strategy: updated.botStrategy,
      totalRuntime: updated.botRuntime,
      tradesExecuted: 0,
    });
  } catch (err) {
    req.log?.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Admin global bot toggle
router.post("/admin/bot/toggle", requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { active } = req.body;
    // For admin, toggle all users' bots
    await db.update(settingsTable).set({ botActive: active });
    res.json({
      active,
      strategy: "TREND_FOLLOWING",
      totalRuntime: 0,
      tradesExecuted: 0,
    });
  } catch (err) {
    req.log?.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
