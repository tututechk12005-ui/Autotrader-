import { useGetTrades, getGetTradesQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

export default function Trades() {
  const { data: trades, isLoading } = useGetTrades({
    query: { queryKey: getGetTradesQueryKey() }
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Trade History</h1>
        <p className="text-muted-foreground mt-1">View your real and bot-executed trades.</p>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>All Trades</CardTitle>
          <CardDescription>Recent trading activity across your connected accounts</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : !trades || trades.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No trades found</div>
          ) : (
            <div className="rounded-md border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Pair</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Side</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Entry Price</TableHead>
                    <TableHead>Exit Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Profit/Loss</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trades.map((trade) => (
                    <TableRow key={trade.id}>
                      <TableCell className="text-muted-foreground whitespace-nowrap">
                        {format(new Date(trade.createdAt), 'yyyy-MM-dd HH:mm')}
                      </TableCell>
                      <TableCell className="font-bold">{trade.pair}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {trade.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className={`font-semibold ${trade.side === 'BUY' ? 'text-success' : 'text-destructive'}`}>
                          {trade.side}
                        </span>
                      </TableCell>
                      <TableCell>${trade.amount.toFixed(2)}</TableCell>
                      <TableCell className="font-mono">${trade.entryPrice.toFixed(2)}</TableCell>
                      <TableCell className="font-mono">{trade.exitPrice ? `$${trade.exitPrice.toFixed(2)}` : '-'}</TableCell>
                      <TableCell>
                        <Badge variant={trade.status === 'OPEN' ? 'default' : trade.status === 'CLOSED' ? 'secondary' : 'destructive'}>
                          {trade.status}
                        </Badge>
                      </TableCell>
                      <TableCell className={`text-right font-semibold ${trade.profit && trade.profit > 0 ? 'text-success' : trade.profit && trade.profit < 0 ? 'text-destructive' : ''}`}>
                        {trade.profit ? `${trade.profit > 0 ? '+' : ''}$${trade.profit.toFixed(2)}` : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
