import { useGetScannerPairs, getGetScannerPairsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, Minus, Wifi, WifiOff } from "lucide-react";
import { useScannerLive, usePrices, useSocketStatus } from "@/hooks/use-realtime";

export default function Scanner() {
  const { data: initial, isLoading } = useGetScannerPairs({
    query: { queryKey: getGetScannerPairsQueryKey() },
  });

  const pairs = useScannerLive(initial);
  const prices = usePrices();
  const socketStatus = useSocketStatus();

  const getSignalStyle = (action: string) => {
    switch (action) {
      case "BUY":  return "bg-[#00C896]/15 text-[#00C896] border-[#00C896]/40";
      case "SELL": return "bg-[#FF3B6B]/15 text-[#FF3B6B] border-[#FF3B6B]/40";
      default:     return "bg-muted text-muted-foreground border-border";
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend.toLowerCase()) {
      case "bullish":  return <TrendingUp  className="w-4 h-4 text-[#00C896]" />;
      case "bearish":  return <TrendingDown className="w-4 h-4 text-[#FF3B6B]" />;
      default:         return <Minus className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getScoreColor = (score: number) =>
    score >= 70 ? "bg-[#00C896]" : score < 40 ? "bg-[#FF3B6B]" : "bg-primary";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Pair Scanner</h1>
          <p className="text-muted-foreground text-sm mt-1">Live-ranked market analysis for top crypto pairs.</p>
        </div>
        <div className="flex items-center gap-2">
          {socketStatus === "connected" ? (
            <>
              <span className="inline-block w-2 h-2 rounded-full bg-[#00C896] animate-pulse" />
              <Wifi className="w-4 h-4 text-[#00C896]" />
              <span className="text-xs text-[#00C896] font-medium">Live — updates every 10s</span>
            </>
          ) : (
            <>
              <WifiOff className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Connecting…</span>
            </>
          )}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        {["BUY", "SELL", "WAIT"].map((sig) => {
          const count = pairs.filter((p) => p.signal === sig).length;
          const color = sig === "BUY" ? "text-[#00C896]" : sig === "SELL" ? "text-[#FF3B6B]" : "text-muted-foreground";
          return (
            <Card key={sig} className="bg-card border-border text-center">
              <CardContent className="p-4">
                <p className={`text-2xl font-bold ${color}`}>{count}</p>
                <p className="text-xs text-muted-foreground mt-1">{sig}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Market Scan Results</CardTitle>
          <CardDescription>Sorted by AI opportunity score · Live prices refresh every 3s</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && pairs.length === 0 ? (
            <div className="space-y-3">
              {Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-12 w-full bg-muted" />)}
            </div>
          ) : pairs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No data available</div>
          ) : (
            <div className="rounded-md border border-border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead className="w-8">#</TableHead>
                    <TableHead>Pair</TableHead>
                    <TableHead>Live Price</TableHead>
                    <TableHead>1m</TableHead>
                    <TableHead>24h</TableHead>
                    <TableHead>Trend</TableHead>
                    <TableHead>Signal</TableHead>
                    <TableHead className="w-44">Score</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pairs.map((pair, idx) => {
                    const live = prices[pair.pair];
                    const displayPrice = live?.price ?? pair.price;
                    const up1m = (live?.change1m ?? 0) >= 0;
                    return (
                      <TableRow key={pair.pair} className="border-border hover:bg-muted/30 transition-colors">
                        <TableCell className="text-muted-foreground text-xs">{idx + 1}</TableCell>
                        <TableCell className="font-bold">{pair.pair}</TableCell>
                        <TableCell className="font-mono text-sm">
                          ${displayPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                        </TableCell>
                        <TableCell className={`text-xs font-medium ${up1m ? "text-[#00C896]" : "text-[#FF3B6B]"}`}>
                          {live ? `${up1m ? "▲" : "▼"} ${Math.abs(live.change1m).toFixed(3)}%` : "—"}
                        </TableCell>
                        <TableCell className={pair.change24h > 0 ? "text-[#00C896] font-medium" : pair.change24h < 0 ? "text-[#FF3B6B] font-medium" : ""}>
                          {pair.change24h > 0 ? "+" : ""}{pair.change24h.toFixed(2)}%
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5 capitalize text-sm">
                            {getTrendIcon(pair.trend)}
                            {pair.trend}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getSignalStyle(pair.signal)}>
                            {pair.signal}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={pair.score} className="h-2 flex-1" indicatorClassName={getScoreColor(pair.score)} />
                            <span className="text-xs font-mono w-7 text-right">{pair.score.toFixed(0)}</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
