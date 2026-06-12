import { useGetSignals, getGetSignalsQueryKey, useGenerateSignals } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";
import { Activity, RefreshCcw, Zap, Wifi, WifiOff } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useLiveSignals, usePrices, useSocketStatus } from "@/hooks/use-realtime";
import { useState, useEffect } from "react";

export default function Signals() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: signals, isLoading } = useGetSignals({
    query: { queryKey: getGetSignalsQueryKey() },
  });

  const generateSignalsMutation = useGenerateSignals();
  const liveSignal = useLiveSignals();
  const prices = usePrices();
  const socketStatus = useSocketStatus();
  const [liveFlash, setLiveFlash] = useState<typeof liveSignal>(null);

  // Track new live signals
  useEffect(() => {
    if (!liveSignal) return;
    setLiveFlash(liveSignal);
    const t = setTimeout(() => setLiveFlash(null), 8000);
    return () => clearTimeout(t);
  }, [liveSignal]);

  const handleGenerate = () => {
    generateSignalsMutation.mutate(undefined, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetSignalsQueryKey() });
        toast({ title: "Signals Generated", description: "Fresh AI signals have been saved." });
      },
      onError: () =>
        toast({ title: "Error", description: "Failed to generate signals", variant: "destructive" }),
    });
  };

  const getSignalStyle = (action: string) => {
    switch (action) {
      case "BUY":  return "bg-[#00C896]/15 text-[#00C896] border-[#00C896]/40";
      case "SELL": return "bg-[#FF3B6B]/15 text-[#FF3B6B] border-[#FF3B6B]/40";
      default:     return "bg-muted text-muted-foreground border-border";
    }
  };

  const getConfidenceColor = (conf: number) => {
    if (conf >= 80) return "bg-[#00C896]";
    if (conf >= 60) return "bg-primary";
    return "bg-[#FF3B6B]";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">AI Signals</h1>
          <div className="flex items-center gap-2 mt-1">
            {socketStatus === "connected" ? (
              <>
                <span className="inline-block w-2 h-2 rounded-full bg-[#00C896] animate-pulse" />
                <Wifi className="w-3 h-3 text-[#00C896]" />
                <span className="text-xs text-[#00C896]">Live signals — new alert every 15s</span>
              </>
            ) : (
              <><WifiOff className="w-3 h-3 text-muted-foreground" /><span className="text-xs text-muted-foreground">Connecting…</span></>
            )}
          </div>
        </div>
        <Button
          onClick={handleGenerate}
          disabled={generateSignalsMutation.isPending}
          variant="outline"
          className="border-primary/50 text-primary hover:bg-primary/10"
        >
          <RefreshCcw className={`w-4 h-4 mr-2 ${generateSignalsMutation.isPending ? "animate-spin" : ""}`} />
          Generate Signals
        </Button>
      </div>

      {/* Live signal flash banner */}
      {liveFlash && (
        <Card className={`border animate-pulse-once ${liveFlash.action === "BUY" ? "border-[#00C896]/50 bg-[#00C896]/5" : "border-[#FF3B6B]/50 bg-[#FF3B6B]/5"}`}>
          <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3 justify-between">
            <div className="flex items-center gap-3">
              <Zap className={`w-5 h-5 animate-bounce ${liveFlash.action === "BUY" ? "text-[#00C896]" : "text-[#FF3B6B]"}`} />
              <div>
                <p className="text-xs text-muted-foreground">Live Signal Detected</p>
                <p className="font-bold text-lg">{liveFlash.pair}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <Badge variant="outline" className={getSignalStyle(liveFlash.action)}>{liveFlash.action}</Badge>
              <span className="text-sm font-mono">Entry <b>${liveFlash.entryPrice.toFixed(2)}</b></span>
              <span className="text-sm">Confidence <b className="text-primary">{liveFlash.confidence.toFixed(1)}%</b></span>
              <span className="text-xs text-muted-foreground">· live</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Signals grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array(6).fill(0).map((_, i) => (
            <Card key={i} className="bg-card border-border">
              <CardHeader><Skeleton className="h-6 w-32" /></CardHeader>
              <CardContent><Skeleton className="h-28 w-full" /></CardContent>
            </Card>
          ))}
        </div>
      ) : !signals || signals.length === 0 ? (
        <Card className="bg-card border-border p-12 text-center">
          <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-medium mb-2">No signals yet</h3>
          <p className="text-muted-foreground mb-6">Click generate to scan the market.</p>
          <Button onClick={handleGenerate}>Scan Market</Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {signals.map((signal) => {
            const livePrice = prices[signal.pair]?.price;
            const ind = signal.indicators as Record<string, number | string>;
            return (
              <Card key={signal.id} className="bg-card border-border hover:border-primary/40 transition-colors">
                <CardHeader className="flex flex-row items-start justify-between pb-2">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      {signal.pair}
                      <Badge variant="outline" className={getSignalStyle(signal.action)}>
                        {signal.action}
                      </Badge>
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(signal.createdAt), "MMM dd HH:mm:ss")}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {signal.strategy && (
                      <Badge variant="secondary" className="text-xs">{signal.strategy}</Badge>
                    )}
                    {livePrice && (
                      <span className="text-xs font-mono text-muted-foreground">
                        Live: ${livePrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground">AI Confidence</span>
                        <span className="font-semibold">{signal.confidence}%</span>
                      </div>
                      <Progress value={signal.confidence} className="h-1.5" indicatorClassName={getConfidenceColor(signal.confidence)} />
                    </div>

                    <div className="grid grid-cols-3 gap-3 p-3 rounded-lg bg-background/60 border border-border text-xs">
                      <div>
                        <p className="text-muted-foreground mb-0.5">Entry</p>
                        <p className="font-mono font-semibold">${signal.entryPrice.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-0.5">Take Profit</p>
                        <p className="font-mono font-semibold text-[#00C896]">${signal.takeProfit.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-0.5">Stop Loss</p>
                        <p className="font-mono font-semibold text-[#FF3B6B]">${signal.stopLoss.toFixed(2)}</p>
                      </div>
                    </div>

                    {ind && (
                      <div className="flex gap-1.5 flex-wrap">
                        {ind.rsi     && <Badge variant="outline" className="text-xs">RSI {Number(ind.rsi).toFixed(1)}</Badge>}
                        {ind.macd    && <Badge variant="outline" className="text-xs">MACD {Number(ind.macd) > 0 ? "+" : ""}{Number(ind.macd).toFixed(2)}</Badge>}
                        {ind.trend   && <Badge variant="outline" className="text-xs">{String(ind.trend)}</Badge>}
                        {ind.trendStrength && <Badge variant="outline" className="text-xs">Str {Number(ind.trendStrength).toFixed(2)}</Badge>}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
