# FLOWSIGNALS AI

A production-ready SaaS crypto trading platform with AI-powered signals, automated bot trading, demo accounts, real Binance integration, and a full admin panel.

---

## Features

- JWT authentication (register / login / protected routes)
- Dashboard with live stats (balance, P&L, win rate, bot status)
- Demo account — $10,000 virtual balance, open/close trades
- Real account — connect Binance API keys (AES-256 encrypted)
- AI market analysis engine (RSI, MACD, EMA 20/50/200, volume, trend)
- Pair scanner — ranks BTCUSDT, ETHUSDT, BNBUSDT, SOLUSDT, XRPUSDT, DOGEUSDT
- Auto trading bot with ON/OFF toggle and strategy selector
- Risk management settings (risk %, stop loss, take profit, drawdown, max trades)
- 5 built-in strategies — Scalping, Swing, Trend Following, SMC, ICT
- Referral system with unique codes and commission tracking
- Admin panel — manage users, view all trades/signals, global bot toggle
- Rate limiting, bcrypt hashing, AES-256 encrypted API keys
- Mobile-first with bottom navigation bar

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, TailwindCSS, shadcn/ui |
| Backend | Node.js 22, Express 5 |
| Database | PostgreSQL + Drizzle ORM |
| Auth | JWT + bcrypt |
| API codegen | Orval (OpenAPI → React Query hooks + Zod) |
| Package manager | pnpm workspaces |

---

## Default Login Credentials

| Role | Email | Password |
|---|---|---|
| Admin | admin@flowsignals.ai | password |
| Demo user | demo@flowsignals.ai | password |

> Change these immediately after first login in production.

---

## Local Setup

### 1. Prerequisites

- Node.js 22+
- pnpm 9+
- PostgreSQL 15+

### 2. Clone and install

```bash
git clone https://github.com/YOUR_USERNAME/flowsignals-ai.git
cd flowsignals-ai
pnpm install
```

### 3. Environment variables

```bash
cp .env.example .env
```

Edit `.env` and fill in:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/flowsignals
JWT_SECRET=your-super-secret-jwt-key-minimum-32-chars
ENCRYPTION_KEY=<64-char hex string>  # openssl rand -hex 32
```

### 4. Database setup

```bash
# Push schema to your database
pnpm --filter @workspace/db run push

# Seed default admin and demo users
psql $DATABASE_URL -f scripts/seed.sql   # optional — or register manually
```

### 5. Run in development

```bash
# Terminal 1 — API server (port 8080)
pnpm --filter @workspace/api-server run dev

# Terminal 2 — Frontend (port 24954)
pnpm --filter @workspace/flowsignals run dev
```

Open [http://localhost:24954](http://localhost:24954)

---

## Build for Production

```bash
pnpm --filter @workspace/api-spec run codegen
pnpm --filter @workspace/flowsignals run build
pnpm --filter @workspace/api-server run build
```

Start:

```bash
node artifacts/api-server/dist/index.mjs
```

The API serves the compiled frontend from `artifacts/flowsignals/dist/` automatically.

---

## GitHub Deployment

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit — FLOWSIGNALS AI"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/flowsignals-ai.git
git push -u origin main
```

### 2. GitHub Actions CI/CD

The included `.github/workflows/ci.yml` runs on every push:
- Type-checks all packages
- Builds frontend and backend
- Reports build status

---

## Railway Deployment

Railway is the recommended one-click hosting provider for this project.

### 1. Create Railway project

1. Go to [railway.app](https://railway.app) and sign in
2. Click **New Project → Deploy from GitHub repo**
3. Select your `flowsignals-ai` repository

### 2. Add PostgreSQL

1. In your Railway project, click **+ New → Database → PostgreSQL**
2. Railway will automatically set `DATABASE_URL` in your environment

### 3. Set environment variables

In Railway → your service → **Variables**, add:

```
JWT_SECRET=your-super-secret-jwt-key
ENCRYPTION_KEY=<64-char hex — openssl rand -hex 32>
NODE_ENV=production
```

### 4. Deploy

Railway picks up `railway.json` and `nixpacks.toml` automatically.
Push to `main` and Railway will build and deploy.

Your app will be live at `https://your-project.up.railway.app`

---

## Project Structure

```
flowsignals-ai/
├── artifacts/
│   ├── api-server/          # Express API (port 8080)
│   │   └── src/
│   │       ├── routes/      # auth, dashboard, demo, signals, scanner, bot, trades, binance, settings, referral, admin
│   │       ├── middlewares/ # JWT auth middleware
│   │       └── lib/         # jwt, crypto, market analysis engine
│   └── flowsignals/         # React + Vite frontend
│       └── src/
│           ├── pages/       # login, register, dashboard, demo, signals, scanner, trades, bot, settings, connect, referral, admin, profile
│           └── components/  # layout (bottom nav), shadcn/ui
├── lib/
│   ├── api-spec/            # OpenAPI spec (source of truth)
│   ├── api-client-react/    # Generated React Query hooks
│   ├── api-zod/             # Generated Zod schemas
│   └── db/                  # Drizzle ORM schema + migrations
├── .env.example
├── railway.json
├── nixpacks.toml
└── pnpm-workspace.yaml
```

---

## API Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | /api/auth/register | — | Register user |
| POST | /api/auth/login | — | Login |
| GET | /api/auth/me | JWT | Current user |
| GET | /api/dashboard/stats | JWT | Dashboard stats |
| GET | /api/demo/account | JWT | Demo account |
| POST | /api/demo/trade | JWT | Place demo trade |
| GET | /api/demo/trades | JWT | Demo trade history |
| POST | /api/demo/trades/:id/close | JWT | Close demo trade |
| GET | /api/signals | JWT | AI signals |
| POST | /api/signals/generate | JWT | Generate signals |
| GET | /api/scanner/pairs | JWT | Pair scanner |
| GET | /api/bot/status | JWT | Bot status |
| POST | /api/bot/toggle | JWT | Toggle bot |
| GET | /api/trades | JWT | Real trade history |
| GET | /api/binance/keys | JWT | Binance key info |
| POST | /api/binance/keys | JWT | Save Binance keys |
| DELETE | /api/binance/keys | JWT | Delete Binance keys |
| GET | /api/binance/balance | JWT | Binance balance |
| GET | /api/settings | JWT | Risk settings |
| PUT | /api/settings | JWT | Update settings |
| GET | /api/referral | JWT | Referral info |
| GET | /api/admin/users | Admin | All users |
| POST | /api/admin/users/:id/toggle | Admin | Enable/disable user |
| GET | /api/admin/trades | Admin | All trades |
| GET | /api/admin/signals | Admin | All signals |
| GET | /api/admin/stats | Admin | Platform stats |
| POST | /api/admin/bot/toggle | Admin | Global bot toggle |

---

## Security Notes

- All passwords hashed with bcrypt (cost factor 12)
- Binance API keys encrypted with AES-256-GCM before storage
- JWT tokens expire after 7 days
- Auth endpoints rate-limited (20 req / 15 min)
- Never commit `.env` — only commit `.env.example`
- Rotate `JWT_SECRET` and `ENCRYPTION_KEY` immediately on first deploy

---

## License

MIT
