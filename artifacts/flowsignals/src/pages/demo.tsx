import { useState } from "react";
import { 
  useGetDemoAccount, 
  getGetDemoAccountQueryKey,
  useGetDemoTrades,
  getGetDemoTradesQueryKey,
  usePlaceDemoTrade,
  useCloseDemoTrade,
  DemoTradeInputSide
} from "@workspace/api-client-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

const pairs = ["BTCUSDT", "ETHUSDT", "BNBUSDT", "SOLUSDT", "XRPUSDT", "DOGEUSDT"];

const formSchema = z.object({
  pair: z.string().min(1, "Pair is required"),
  side: z.nativeEnum(DemoTradeInputSide),
  amount: z.coerce.number().positive("Amount must be positive"),
  stopLoss: z.coerce.number().positive("Stop loss must be positive").optional().or(z.literal("")),
  takeProfit: z.coerce.number().positive("Take profit must be positive").optional().or(z.literal("")),
});

export default function Demo() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: account, isLoading: accountLoading } = useGetDemoAccount({
    query: { queryKey: getGetDemoAccountQueryKey() }
  });

  const { data: trades, isLoading: tradesLoading } = useGetDemoTrades({
    query: { queryKey: getGetDemoTradesQueryKey() }
  });

  const placeTradeMutation = usePlaceDemoTrade();
  const closeTradeMutation = useCloseDemoTrade();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      pair: "BTCUSDT",
      side: DemoTradeInputSide.BUY,
      amount: 100,
      stopLoss: undefined,
      takeProfit: undefined,
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    placeTradeMutation.mutate(
      { 
        data: {
          pair: values.pair,
          side: values.side,
          amount: values.amount,
          stopLoss: values.stopLoss ? Number(values.stopLoss) : undefined,
          takeProfit: values.takeProfit ? Number(values.takeProfit) : undefined,
        }
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetDemoAccountQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetDemoTradesQueryKey() });
          toast({ title: "Trade Placed", description: `Successfully placed demo trade for ${values.pair}` });
          form.reset();
        },
        onError: (error) => {
          toast({ title: "Trade Failed", description: error.message || "Failed to place trade", variant: "destructive" });
        }
      }
    );
  }

  function handleCloseTrade(id: number) {
    closeTradeMutation.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetDemoAccountQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetDemoTradesQueryKey() });
          toast({ title: "Trade Closed", description: `Successfully closed demo trade` });
        },
        onError: (error) => {
          toast({ title: "Failed to close trade", description: error.message || "An error occurred", variant: "destructive" });
        }
      }
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Demo Trading</h1>
        <p className="text-muted-foreground mt-1">Practice trading with $10,000 virtual funds.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="col-span-1 bg-card border-border">
          <CardHeader>
            <CardTitle>Demo Account</CardTitle>
          </CardHeader>
          <CardContent>
            {accountLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-4 w-24" />
              </div>
            ) : account ? (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Balance</p>
                  <p className="text-3xl font-bold">${account.balance.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                  <div>
                    <p className="text-xs text-muted-foreground">Total Profit</p>
                    <p className={`font-semibold ${account.totalProfit >= 0 ? 'text-success' : 'text-destructive'}`}>
                      ${account.totalProfit.toLocaleString(undefined, {minimumFractionDigits: 2})}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Win Rate</p>
                    <p className="font-semibold">{account.winRate.toFixed(1)}%</p>
                  </div>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="col-span-1 md:col-span-2 bg-card border-border">
          <CardHeader>
            <CardTitle>Place Trade</CardTitle>
            <CardDescription>Open a new virtual position</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="pair"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pair</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select pair" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {pairs.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="side"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Side</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select side" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value={DemoTradeInputSide.BUY}>BUY</SelectItem>
                            <SelectItem value={DemoTradeInputSide.SELL}>SELL</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amount (USD)</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <FormField
                      control={form.control}
                      name="stopLoss"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Stop Loss (Opt)</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} value={field.value ?? ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="takeProfit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Take Profit (Opt)</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} value={field.value ?? ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                <Button 
                  type="submit" 
                  className={`w-full ${form.watch('side') === 'BUY' ? 'bg-success hover:bg-success/90' : 'bg-destructive hover:bg-destructive/90'} text-white`}
                  disabled={placeTradeMutation.isPending}
                >
                  {placeTradeMutation.isPending ? "Processing..." : `${form.watch('side')} ${form.watch('pair')}`}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Trade History</CardTitle>
        </CardHeader>
        <CardContent>
          {tradesLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : !trades || trades.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No trades found. Start trading above!</div>
          ) : (
            <div className="rounded-md border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pair</TableHead>
                    <TableHead>Side</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Entry Price</TableHead>
                    <TableHead>Current/Exit</TableHead>
                    <TableHead>Profit/Loss</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trades.map((trade) => (
                    <TableRow key={trade.id}>
                      <TableCell className="font-medium">{trade.pair}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={trade.side === 'BUY' ? 'text-success border-success' : 'text-destructive border-destructive'}>
                          {trade.side}
                        </Badge>
                      </TableCell>
                      <TableCell>${trade.amount.toFixed(2)}</TableCell>
                      <TableCell>${trade.entryPrice.toFixed(2)}</TableCell>
                      <TableCell>{trade.exitPrice ? `$${trade.exitPrice.toFixed(2)}` : '-'}</TableCell>
                      <TableCell className={trade.profit && trade.profit > 0 ? 'text-success' : trade.profit && trade.profit < 0 ? 'text-destructive' : ''}>
                        {trade.profit ? `$${trade.profit.toFixed(2)}` : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={trade.status === 'OPEN' ? 'default' : 'secondary'}>
                          {trade.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {format(new Date(trade.createdAt), 'MMM dd HH:mm')}
                      </TableCell>
                      <TableCell className="text-right">
                        {trade.status === 'OPEN' && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleCloseTrade(trade.id)}
                            disabled={closeTradeMutation.isPending}
                          >
                            Close
                          </Button>
                        )}
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
