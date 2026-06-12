import { Server as SocketIOServer } from "socket.io";
import type { Server as HttpServer } from "http";
import { verifyToken } from "./jwt.js";
import { scanAllPairs, analyzeMarket, PAIRS } from "./market.js";
import { logger } from "./logger.js";

let io: SocketIOServer | null = null;

export function initSocket(server: HttpServer): SocketIOServer {
  io = new SocketIOServer(server, {
    cors: { origin: "*", methods: ["GET", "POST"] },
    transports: ["websocket", "polling"],
  });

  // Auth middleware — require valid JWT on connection
  io.use((socket, next) => {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.replace("Bearer ", "");
    if (!token) {
      return next(new Error("Authentication required"));
    }
    try {
      const payload = verifyToken(token as string);
      socket.data.userId = payload.userId;
      socket.data.role = payload.role;
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    logger.info({ userId: socket.data.userId }, "Socket connected");

    // Send initial snapshot immediately on connect
    socket.emit("prices", buildPriceSnapshot());
    socket.emit("scanner", scanAllPairs());

    socket.on("subscribe:pair", (pair: string) => {
      socket.join(`pair:${pair}`);
    });

    socket.on("disconnect", () => {
      logger.info({ userId: socket.data.userId }, "Socket disconnected");
    });
  });

  return io;
}

export function getIO(): SocketIOServer | null {
  return io;
}

// ── Price snapshot ──────────────────────────────────────────────────────────

interface PriceUpdate {
  pair: string;
  price: number;
  change1m: number;
}

function buildPriceSnapshot(): PriceUpdate[] {
  return PAIRS.map((pair) => {
    const analysis = analyzeMarket(pair);
    return {
      pair,
      price: analysis.entryPrice,
      change1m: parseFloat(((Math.random() - 0.5) * 0.6).toFixed(3)),
    };
  });
}

// ── Broadcast loop ──────────────────────────────────────────────────────────

export function startPriceBroadcaster(): void {
  // Prices every 3 seconds
  setInterval(() => {
    if (!io) return;
    const prices = buildPriceSnapshot();
    io.emit("prices", prices);
  }, 3000);

  // Full scanner rescan every 10 seconds
  setInterval(() => {
    if (!io) return;
    io.emit("scanner", scanAllPairs());
  }, 10000);

  // Live signal flash every 15 seconds (pick a random pair and emit a signal)
  setInterval(() => {
    if (!io) return;
    const pair = PAIRS[Math.floor(Math.random() * PAIRS.length)];
    const analysis = analyzeMarket(pair);
    if (analysis.action !== "WAIT") {
      io.emit("signal:new", {
        pair,
        action: analysis.action,
        confidence: analysis.confidence,
        entryPrice: analysis.entryPrice,
        stopLoss: analysis.stopLoss,
        takeProfit: analysis.takeProfit,
        indicators: analysis.indicators,
      });
    }
  }, 15000);
}
