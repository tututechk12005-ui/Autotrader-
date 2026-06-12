import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import dashboardRouter from "./dashboard.js";
import demoRouter from "./demo.js";
import signalsRouter from "./signals.js";
import scannerRouter from "./scanner.js";
import botRouter from "./bot.js";
import tradesRouter from "./trades.js";
import binanceRouter from "./binance.js";
import settingsRouter from "./settings.js";
import referralRouter from "./referral.js";
import adminRouter from "./admin.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(dashboardRouter);
router.use(demoRouter);
router.use(signalsRouter);
router.use(scannerRouter);
router.use(botRouter);
router.use(tradesRouter);
router.use(binanceRouter);
router.use(settingsRouter);
router.use(referralRouter);
router.use(adminRouter);

export default router;
