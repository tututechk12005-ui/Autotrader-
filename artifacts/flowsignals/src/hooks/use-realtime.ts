import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { getToken } from "@/lib/auth";

export interface PriceUpdate {
  pair: string;
  price: number;
  change1m: number;
}

export interface ScannerPair {
  pair: string;
  score: number;
  trend: string;
  signal: "BUY" | "SELL" | "WAIT";
  price: number;
  change24h: number;
}

export interface LiveSignal {
  pair: string;
  action: "BUY" | "SELL" | "WAIT";
  confidence: number;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  indicators: Record<string, unknown>;
}

let sharedSocket: Socket | null = null;
let refCount = 0;

function getSocket(): Socket {
  if (!sharedSocket) {
    const token = getToken();
    sharedSocket = io("/", {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
    });
  }
  return sharedSocket;
}

function releaseSocket() {
  refCount--;
  if (refCount <= 0) {
    sharedSocket?.disconnect();
    sharedSocket = null;
    refCount = 0;
  }
}

// ── usePrices ────────────────────────────────────────────────────────────────
export function usePrices(): Record<string, PriceUpdate> {
  const [prices, setPrices] = useState<Record<string, PriceUpdate>>({});

  useEffect(() => {
    const socket = getSocket();
    refCount++;

    const handler = (updates: PriceUpdate[]) => {
      setPrices((prev) => {
        const next = { ...prev };
        for (const u of updates) next[u.pair] = u;
        return next;
      });
    };

    socket.on("prices", handler);
    return () => {
      socket.off("prices", handler);
      releaseSocket();
    };
  }, []);

  return prices;
}

// ── useScannerLive ───────────────────────────────────────────────────────────
export function useScannerLive(initial: ScannerPair[] | undefined) {
  const [pairs, setPairs] = useState<ScannerPair[]>(initial ?? []);

  useEffect(() => {
    if (initial && initial.length > 0 && pairs.length === 0) {
      setPairs(initial);
    }
  }, [initial]);

  useEffect(() => {
    const socket = getSocket();
    refCount++;

    const handler = (data: ScannerPair[]) => setPairs(data);
    socket.on("scanner", handler);
    return () => {
      socket.off("scanner", handler);
      releaseSocket();
    };
  }, []);

  return pairs;
}

// ── useLiveSignals ───────────────────────────────────────────────────────────
export function useLiveSignals(): LiveSignal | null {
  const [latest, setLatest] = useState<LiveSignal | null>(null);

  useEffect(() => {
    const socket = getSocket();
    refCount++;

    const handler = (signal: LiveSignal) => setLatest(signal);
    socket.on("signal:new", handler);
    return () => {
      socket.off("signal:new", handler);
      releaseSocket();
    };
  }, []);

  return latest;
}

// ── useSocketStatus ──────────────────────────────────────────────────────────
export function useSocketStatus(): "connected" | "connecting" | "disconnected" {
  const [status, setStatus] = useState<"connected" | "connecting" | "disconnected">("connecting");

  useEffect(() => {
    const socket = getSocket();
    refCount++;

    const onConnect = () => setStatus("connected");
    const onDisconnect = () => setStatus("disconnected");
    const onError = () => setStatus("disconnected");

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onError);

    if (socket.connected) setStatus("connected");

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onError);
      releaseSocket();
    };
  }, []);

  return status;
}
