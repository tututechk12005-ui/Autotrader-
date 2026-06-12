import {
  useGetDashboardStats,
  getGetDashboardStatsQueryKey,
  useToggleBot,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Activity,
  Target,
  BarChart3,
  Bot,
  Zap,
  Wifi,
  WifiOff,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { usePrices, useSocketStatus, useLiveSignals } from "@/hooks/use-realtime";
import { useState, useEffect } from "react";

const PAIRS = ["BTCUSDT", "ETHUSDT", "BNBUSDT", "SOLUSDT", "XRPUSDT", "DOGEUSDT"];

export default function Dashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: stats, isLoading } = useGetDashboardStats({
    query: { queryKey: getGetDashboardStatsQueryKey() },
  });
  const toggleBotMutation = useToggleBot();
  const prices = usePrices();
  const socketStatus = useSocketStatus();
  const latestSignal = useLiveSignals();

  // Flash new signal as toast
  const [lastSignalId, setLastSignalId] = useState<string | null>(null);
  useEffect(() => {
    if (!latestSignal) return;
    const key = `${latestSignal.pair}-${latestSignal.action}-${latestSignal.entryPrice}`;
    if (key === lastSignalId) return;
    setLastSignalId(key);
    toast({
      title: `${latestSignal.action} Signal — ${latestSignal.pair}`,
      description: `Confidence ${latestSignal.confidence.toFixed(1)}% · Entry $${latestSignal.entryPrice.toFixed(2)}`,
    });
  }, [latestSignal]);

  const handleToggleBot = (checked: boolean) => {
    toggleBotMutation.mutate(
      { data: { active: checked } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetDashboardStatsQueryKey() });
          toast({
            title: "Bot Status Updated",
            description: `Auto-trading bot is now ${checked ? "active" : "inactive"}`,
          });
        },
        onError: () =>
          toast({ title: "Error", description: "Failed to update bot status", variant: "destructive" }),
      }
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48 bg-muted" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array(8).fill(0).map((_, i) => (
            <Card key={i} className="bg-card border-border">
              <CardHeader className="pb-2"><Skeleton className="h-4 w-24 bg-muted" /></CardHeader>
              <CardContent><Skeleton className="h-8 w-28 bg-muted" /></CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Dashboard</h1>
          <div className="flex items-center gap-2 mt-1">
            {socketStatus === "connected" ? (
              <><Wifi className="w-3 h-3 text-[#00C896]" /><span className="text-xs text-[#00C896]">Live</span></>
            ) : (
              <><WifiOff className="w-3 h-3 text-muted-foreground" /><span className="text-xs text-muted-foreground">Connecting…</span></>
            )}
          </div>
        </div>

        <Card className="bg-card border-border w-full sm:w-auto">
          <CardContent className="p-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Bot className={`w-5 h-5 ${stats.botActive ? "text-primary" : "text-muted-foreground"}`} />
              <span className="font-medium text-sm">Bot</span>
              <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${stats.botActive ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}>
                {stats.botActive ? "ON" : "OFF"}
              </span>
            </div>
            <Switch
              checked={stats.botActive}
              onCheckedChange={handleToggleBot}
              disabled={toggleBotMutation.isPending}
              className="data-[state=checked]:bg-primary"
            />
          </CardContent>
        </Card>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatsCard title="Demo Balance" value={`$${stats.demoBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} icon={DollarSign} />
        <StatsCard title="Daily P&L" value={`${stats.dailyProfit >= 0 ? "+" : ""}$${stats.dailyProfit.toFixed(2)}`} icon={stats.dailyProfit >= 0 ? TrendingUp : TrendingDown} trend={stats.dailyProfit > 0 ? "positive" : stats.dailyProfit < 0 ? "negative" : "neutral"} />
        <StatsCard title="Monthly P&L" value={`${stats.monthlyProfit >= 0 ? "+" : ""}$${stats.monthlyProfit.toFixed(2)}`} icon={BarChart3} trend={stats.monthlyProfit > 0 ? "positive" : stats.monthlyProfit < 0 ? "negative" : "neutral"} />
        <StatsCard title="Win Rate" value={`${stats.winRate.toFixed(1)}%`} icon={Target} trend={stats.winRate >= 50 ? "positive" : "negative"} />
        <StatsCard title="Active Trades" value={stats.activeTrades.toString()} icon={Activity} />
        <StatsCard title="Total Trades" value={stats.totalTrades.toString()} icon={BarChart3} />
        <StatsCard title="Profit Factor" value={stats.profitFactor.toFixed(2)} icon={TrendingUp} trend={stats.profitFactor > 1 ? "positive" : "negative"} />
        <StatsCard title="Bot Status" value={stats.botActive ? "Running" : "Stopped"} icon={Bot} trend={stats.botActive ? "positive" : "neutral"} />
      </div>

      {/* Live price ticker */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Zap className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Live Prices</h2>
          {socketStatus === "connected" && (
            <span className="inline-block w-2 h-2 rounded-full bg-[#00C896] animate-pulse" />
          )}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {PAIRS.map((pair) => {
            const p = prices[pair];
            const up = (p?.change1m ?? 0) >= 0;
            return (
              <Card key={pair} className="bg-card border-border hover:border-primary/30 transition-colors">
                <CardContent className="p-3">
                  <p className="text-xs text-muted-foreground font-medium mb-1">
                    {pair.replace("USDT", "")}
                  </p>
                  <p className="font-mono text-sm font-bold text-foreground">
                    {p ? `$${p.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}` : "—"}
                  </p>
                  {p && (
                    <p className={`text-xs font-medium mt-0.5 ${up ? "text-[#00C896]" : "text-[#FF3B6B]"}`}>
                      {up ? "▲" : "▼"} {Math.abs(p.change1m).toFixed(3)}%
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Latest live signal banner */}
      {latestSignal && (
        <Card className={`border ${latestSignal.action === "BUY" ? "border-[#00C896]/40 bg-[#00C896]/5" : "border-[#FF3B6B]/40 bg-[#FF3B6B]/5"}`}>
          <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Zap className={`w-5 h-5 ${latestSignal.action === "BUY" ? "text-[#00C896]" : "text-[#FF3B6B]"}`} />
              <div>
                <p className="text-xs text-muted-foreground">Latest Live Signal</p>
                <p className="font-bold">{latestSignal.pair}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 flex-wrap">
              <Badge className={latestSignal.action === "BUY" ? "bg-[#00C896]/20 text-[#00C896] border-[#00C896]/40" : "bg-[#FF3B6B]/20 text-[#FF3B6B] border-[#FF3B6B]/40"}>
                {latestSignal.action}
              </Badge>
              <span className="text-sm">Entry <span className="font-mono font-semibold">${latestSignal.entryPrice.toFixed(2)}</span></span>
              <span className="text-sm">Confidence <span className="font-semibold text-primary">{latestSignal.confidence.toFixed(1)}%</span></span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StatsCard({
  title,
  value,
  icon: Icon,
  trend,
}: {
  title: string;
  value: string;
  icon: React.ElementType;
  trend?: "positive" | "negative" | "neutral";
}) {
  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-4">
        <CardTitle className="text-xs font-medium text-muted-foreground truncate">{title}</CardTitle>
        <Icon className="h-3.5 w-3.5 text-primary shrink-0" />
      </CardHeader>
      <CardContent className="px-4 pb-3">
        <div className={`text-xl font-bold ${trend === "positive" ? "text-[#00C896]" : trend === "negative" ? "text-[#FF3B6B]" : "text-foreground"}`}>
          {value}
        </div>
      </CardContent>
    </Card>
  );
}
