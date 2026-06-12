import { pgTable, serial, text, boolean, integer, real, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// Users
export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().default("user"), // "user" | "admin"
  isActive: boolean("is_active").notNull().default(true),
  referralCode: text("referral_code").unique(),
  referredBy: integer("referred_by"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true, createdAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;

// API Keys (Binance) - encrypted
export const apiKeysTable = pgTable("api_keys", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  apiKeyEncrypted: text("api_key_encrypted").notNull(),
  secretKeyEncrypted: text("secret_key_encrypted").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type ApiKey = typeof apiKeysTable.$inferSelect;

// Demo Accounts
export const demoAccountsTable = pgTable("demo_accounts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }).unique(),
  balance: real("balance").notNull().default(10000),
  totalProfit: real("total_profit").notNull().default(0),
  totalTrades: integer("total_trades").notNull().default(0),
  winTrades: integer("win_trades").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type DemoAccount = typeof demoAccountsTable.$inferSelect;

// Trades (both demo and real)
export const tradesTable = pgTable("trades", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  pair: text("pair").notNull(),
  side: text("side").notNull(), // "BUY" | "SELL"
  entryPrice: real("entry_price").notNull(),
  exitPrice: real("exit_price"),
  amount: real("amount").notNull(),
  profit: real("profit"),
  stopLoss: real("stop_loss"),
  takeProfit: real("take_profit"),
  status: text("status").notNull().default("OPEN"), // "OPEN" | "CLOSED" | "CANCELLED"
  type: text("type").notNull().default("DEMO"), // "DEMO" | "REAL"
  createdAt: timestamp("created_at").notNull().defaultNow(),
  closedAt: timestamp("closed_at"),
});

export type Trade = typeof tradesTable.$inferSelect;

// Signals
export const signalsTable = pgTable("signals", {
  id: serial("id").primaryKey(),
  pair: text("pair").notNull(),
  action: text("action").notNull(), // "BUY" | "SELL" | "WAIT"
  confidence: real("confidence").notNull(),
  entryPrice: real("entry_price").notNull(),
  stopLoss: real("stop_loss").notNull(),
  takeProfit: real("take_profit").notNull(),
  indicators: jsonb("indicators").notNull(),
  strategy: text("strategy"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Signal = typeof signalsTable.$inferSelect;

// User Settings
export const settingsTable = pgTable("settings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }).unique(),
  riskPercent: real("risk_percent").notNull().default(2),
  stopLossPercent: real("stop_loss_percent").notNull().default(2),
  takeProfitPercent: real("take_profit_percent").notNull().default(4),
  dailyDrawdownPercent: real("daily_drawdown_percent").notNull().default(5),
  maxOpenTrades: integer("max_open_trades").notNull().default(3),
  strategy: text("strategy").notNull().default("TREND_FOLLOWING"),
  botActive: boolean("bot_active").notNull().default(false),
  botStrategy: text("bot_strategy").notNull().default("TREND_FOLLOWING"),
  botRuntime: integer("bot_runtime").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Settings = typeof settingsTable.$inferSelect;

// Referrals
export const referralsTable = pgTable("referrals", {
  id: serial("id").primaryKey(),
  referrerId: integer("referrer_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  referredUserId: integer("referred_user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  commission: real("commission").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Referral = typeof referralsTable.$inferSelect;
