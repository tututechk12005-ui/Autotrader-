import { Router } from "express";
import { requireAuth, type AuthRequest } from "../middlewares/auth.js";
import { scanAllPairs } from "../lib/market.js";

const router = Router();

router.get("/scanner/pairs", requireAuth, async (req: AuthRequest, res) => {
  try {
    const pairs = scanAllPairs();
    res.json(pairs);
  } catch (err) {
    req.log?.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
