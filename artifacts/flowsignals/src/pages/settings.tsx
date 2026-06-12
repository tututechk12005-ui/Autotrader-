import { useGetSettings, getGetSettingsQueryKey, useUpdateSettings, UserSettingsInputStrategy } from "@workspace/api-client-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";

const formSchema = z.object({
  riskPercent: z.coerce.number().min(0.1).max(100),
  stopLossPercent: z.coerce.number().min(0.1).max(100),
  takeProfitPercent: z.coerce.number().min(0.1).max(1000),
  dailyDrawdownPercent: z.coerce.number().min(0.1).max(100),
  maxOpenTrades: z.coerce.number().min(1).max(50),
  strategy: z.nativeEnum(UserSettingsInputStrategy),
});

export default function Settings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useGetSettings({
    query: { queryKey: getGetSettingsQueryKey() }
  });

  const updateSettingsMutation = useUpdateSettings();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      riskPercent: 1,
      stopLossPercent: 2,
      takeProfitPercent: 6,
      dailyDrawdownPercent: 5,
      maxOpenTrades: 3,
      strategy: UserSettingsInputStrategy.SCALPING,
    },
  });

  useEffect(() => {
    if (settings) {
      form.reset({
        riskPercent: settings.riskPercent,
        stopLossPercent: settings.stopLossPercent,
        takeProfitPercent: settings.takeProfitPercent,
        dailyDrawdownPercent: settings.dailyDrawdownPercent,
        maxOpenTrades: settings.maxOpenTrades,
        strategy: settings.strategy as UserSettingsInputStrategy,
      });
    }
  }, [settings, form]);

  function onSubmit(values: z.infer<typeof formSchema>) {
    updateSettingsMutation.mutate(
      { data: values },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetSettingsQueryKey() });
          toast({ title: "Settings Updated", description: "Your risk management settings have been saved." });
        },
        onError: () => {
          toast({ title: "Error", description: "Failed to update settings.", variant: "destructive" });
        }
      }
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Risk Management</h1>
        <p className="text-muted-foreground mt-1">Configure your trading parameters and global risk limits.</p>
      </div>

      <Card className="bg-card border-border max-w-2xl">
        <CardHeader>
          <CardTitle>Global Settings</CardTitle>
          <CardDescription>These rules apply to all automated bot trades.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="riskPercent"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Risk Per Trade (%)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.1" {...field} className="bg-background" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="maxOpenTrades"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Max Open Trades</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} className="bg-background" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="stopLossPercent"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Default Stop Loss (%)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.1" {...field} className="bg-background" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="takeProfitPercent"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Default Take Profit (%)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.1" {...field} className="bg-background" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="dailyDrawdownPercent"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Daily Max Drawdown (%)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.1" {...field} className="bg-background" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="strategy"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Default Strategy</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-background">
                              <SelectValue placeholder="Select strategy" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value={UserSettingsInputStrategy.SCALPING}>Scalping</SelectItem>
                            <SelectItem value={UserSettingsInputStrategy.SWING}>Swing</SelectItem>
                            <SelectItem value={UserSettingsInputStrategy.TREND_FOLLOWING}>Trend Following</SelectItem>
                            <SelectItem value={UserSettingsInputStrategy.SMC}>SMC</SelectItem>
                            <SelectItem value={UserSettingsInputStrategy.ICT}>ICT</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <Button type="submit" disabled={updateSettingsMutation.isPending} className="w-full sm:w-auto">
                  {updateSettingsMutation.isPending ? "Saving..." : "Save Settings"}
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
