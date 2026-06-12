import { 
  useGetBinanceKeys, 
  getGetBinanceKeysQueryKey,
  useSaveBinanceKeys,
  useDeleteBinanceKeys,
  useGetBinanceBalance,
  getGetBinanceBalanceQueryKey
} from "@workspace/api-client-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Link as LinkIcon, Unlink, ShieldCheck, Wallet } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const formSchema = z.object({
  apiKey: z.string().min(10, "API Key is required"),
  secretKey: z.string().min(10, "Secret Key is required"),
});

export default function Connect() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: keysInfo, isLoading: keysLoading } = useGetBinanceKeys({
    query: { queryKey: getGetBinanceKeysQueryKey() }
  });

  const { data: balance, isLoading: balanceLoading } = useGetBinanceBalance({
    query: { 
      queryKey: getGetBinanceBalanceQueryKey(),
      enabled: !!keysInfo?.hasKeys 
    }
  });

  const saveKeysMutation = useSaveBinanceKeys();
  const deleteKeysMutation = useDeleteBinanceKeys();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      apiKey: "",
      secretKey: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    saveKeysMutation.mutate(
      { data: values },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetBinanceKeysQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetBinanceBalanceQueryKey() });
          toast({ title: "Exchange Connected", description: "Binance API keys saved successfully." });
          form.reset();
        },
        onError: () => {
          toast({ title: "Connection Failed", description: "Invalid keys or permissions.", variant: "destructive" });
        }
      }
    );
  }

  function handleDisconnect() {
    deleteKeysMutation.mutate(undefined, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetBinanceKeysQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetBinanceBalanceQueryKey() });
        toast({ title: "Disconnected", description: "API keys removed." });
      }
    });
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Connect Exchange</h1>
        <p className="text-muted-foreground mt-1">Link your Binance account for automated trading.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card border-border">
          <CardHeader>
            <div className="flex items-center gap-2 mb-1">
              <LinkIcon className="w-5 h-5 text-primary" />
              <CardTitle>API Connection</CardTitle>
            </div>
            <CardDescription>Enter your Binance API keys with Spot Trading permissions enabled. Do not enable withdrawal permissions.</CardDescription>
          </CardHeader>
          
          {keysLoading ? (
            <CardContent><Skeleton className="h-32 w-full" /></CardContent>
          ) : keysInfo?.hasKeys ? (
            <>
              <CardContent className="space-y-4">
                <div className="p-4 bg-success/10 border border-success/20 rounded-lg flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-success mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-success">Connected Successfully</h4>
                    <p className="text-sm text-success/80 mt-1">API Key: {keysInfo.apiKeyMasked}</p>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  variant="destructive" 
                  onClick={handleDisconnect}
                  disabled={deleteKeysMutation.isPending}
                  className="w-full"
                >
                  <Unlink className="w-4 h-4 mr-2" />
                  Disconnect Exchange
                </Button>
              </CardFooter>
            </>
          ) : (
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="apiKey"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>API Key</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your Binance API Key" {...field} className="bg-background font-mono" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="secretKey"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Secret Key</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Enter your Binance Secret Key" {...field} className="bg-background font-mono" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={saveKeysMutation.isPending}>
                    {saveKeysMutation.isPending ? "Connecting..." : "Connect Binance"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          )}
        </Card>

        <Card className={`bg-card border-border ${!keysInfo?.hasKeys ? 'opacity-50 pointer-events-none' : ''}`}>
          <CardHeader>
            <div className="flex items-center gap-2 mb-1">
              <Wallet className="w-5 h-5 text-primary" />
              <CardTitle>Exchange Balance</CardTitle>
            </div>
            <CardDescription>Your real spot wallet balances</CardDescription>
          </CardHeader>
          <CardContent>
            {keysInfo?.hasKeys ? (
              balanceLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-8 w-48" />
                  <Skeleton className="h-32 w-full" />
                </div>
              ) : balance ? (
                <div className="space-y-6">
                  <div>
                    <p className="text-sm text-muted-foreground">Estimated Total Value</p>
                    <p className="text-3xl font-bold text-primary">${balance.totalUsdt.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
                  </div>
                  
                  {balance.assets && balance.assets.length > 0 ? (
                    <div className="border border-border rounded-md">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Asset</TableHead>
                            <TableHead className="text-right">Free</TableHead>
                            <TableHead className="text-right">Locked</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {balance.assets.map(asset => (
                            <TableRow key={asset.asset}>
                              <TableCell className="font-bold">{asset.asset}</TableCell>
                              <TableCell className="text-right font-mono">{asset.free.toLocaleString()}</TableCell>
                              <TableCell className="text-right font-mono text-muted-foreground">{asset.locked.toLocaleString()}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">No positive balances found.</p>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground">Failed to load balances.</p>
              )
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Connect your exchange to view balances.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
