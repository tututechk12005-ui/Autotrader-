// Simulated market data + technical analysis engine
// Replace with real Binance API calls when API keys are connected

const PAIRS = ["BTCUSDT", "ETHUSDT", "BNBUSDT", "SOLUSDT", "XRPUSDT", "DOGEUSDT"];

const BASE_PRICES: Record<string, number> = {
  BTCUSDT: 67500,
  ETHUSDT: 3450,
  BNBUSDT: 590,
  SOLUSDT: 175,
  XRPUSDT: 0.52,
  DOGEUSDT: 0.165,
};

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function jitter(base: number, pct = 0.02): number {
  return base * (1 + (Math.random() - 0.5) * pct);
}

export function getPrice(pair: string): number {
  const base = BASE_PRICES[pair] ?? 1;
  return parseFloat(jitter(base, 0.04).toFixed(pair.includes("DOGE") ? 4 : pair.includes("XRP") ? 4 : 2));
}

export interface Indicators {
  rsi: number;
  macd: number;
  ema20: number;
  ema50: number;
  ema200: number;
  volume: number;
  trend: string;
  trendStrength: number;
}

export function analyzeMarket(pair: string): {
  action: "BUY" | "SELL" | "WAIT";
  confidence: number;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  indicators: Indicators;
} {
  const price = getPrice(pair);
  const rsi = rand(20, 80);
  const macd = rand(-50, 50);
  const trendStrength = rand(0.3, 0.95);

  const ema20 = jitter(price, 0.01);
  const ema50 = jitter(price, 0.03);
  const ema200 = jitter(price, 0.08);
  const volume = rand(1_000_000, 50_000_000);
  const isBullish = ema20 > ema50 && ema50 > ema200;
  const isBearish = ema20 < ema50 && ema50 < ema200;
  const trend = isBullish ? "BULLISH" : isBearish ? "BEARISH" : "SIDEWAYS";

  let action: "BUY" | "SELL" | "WAIT";
  let confidence: number;

  if (rsi < 35 && isBullish && macd > 0) {
    action = "BUY";
    confidence = rand(70, 95);
  } else if (rsi > 65 && isBearish && macd < 0) {
    action = "SELL";
    confidence = rand(68, 92);
  } else if (rsi < 30) {
    action = "BUY";
    confidence = rand(55, 75);
  } else if (rsi > 70) {
    action = "SELL";
    confidence = rand(55, 75);
  } else {
    action = "WAIT";
    confidence = rand(30, 60);
  }

  const slPct = 0.02;
  const tpPct = 0.04;
  const stopLoss = action === "BUY" ? price * (1 - slPct) : price * (1 + slPct);
  const takeProfit = action === "BUY" ? price * (1 + tpPct) : price * (1 - tpPct);

  return {
    action,
    confidence: parseFloat(confidence.toFixed(1)),
    entryPrice: price,
    stopLoss: parseFloat(stopLoss.toFixed(4)),
    takeProfit: parseFloat(takeProfit.toFixed(4)),
    indicators: {
      rsi: parseFloat(rsi.toFixed(2)),
      macd: parseFloat(macd.toFixed(4)),
      ema20: parseFloat(ema20.toFixed(4)),
      ema50: parseFloat(ema50.toFixed(4)),
      ema200: parseFloat(ema200.toFixed(4)),
      volume: parseFloat(volume.toFixed(0)),
      trend,
      trendStrength: parseFloat(trendStrength.toFixed(2)),
    },
  };
}

export function scanAllPairs(): Array<{
  pair: string;
  score: number;
  trend: string;
  signal: "BUY" | "SELL" | "WAIT";
  price: number;
  change24h: number;
}> {
  return PAIRS.map((pair) => {
    const analysis = analyzeMarket(pair);
    const score = analysis.action === "WAIT" ? rand(20, 50) : analysis.confidence;
    return {
      pair,
      score: parseFloat(score.toFixed(1)),
      trend: analysis.indicators.trend,
      signal: analysis.action,
      price: analysis.entryPrice,
      change24h: parseFloat((rand(-8, 8)).toFixed(2)),
    };
  }).sort((a, b) => b.score - a.score);
}

export { PAIRS };
