import { 
  useGetBotStatus, 
  getGetBotStatusQueryKey,
  useToggleBot,
  useGetSettings,
  getGetSettingsQueryKey,
  useUpdateSettings,
  UserSettingsInputStrategy
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Bot as BotIcon, Activity, Clock, BarChart3, Settings2 } from "lucide-react";
import { useState, useEffect } from "react";

export default function BotPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [strategy, setStrategy] = useState<UserSettingsInputStrategy | "">("");

  const { data: status, isLoading: statusLoading } = useGetBotStatus({
    query: { queryKey: getGetBotStatusQueryKey() }
  });

  const { data: settings, isLoading: settingsLoading } = useGetSettings({
    query: { queryKey: getGetSettingsQueryKey() }
  });

  useEffect(() => {
    if (settings?.strategy) {
      setStrategy(settings.strategy as UserSettingsInputStrategy);
    }
  }, [settings]);

  const toggleBotMutation = useToggleBot();
  const updateSettingsMutation = useUpdateSettings();

  const handleToggleBot = (checked: boolean) => {
    toggleBotMutation.mutate(
      { data: { active: checked } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetBotStatusQueryKey() });
          toast({
            title: "Bot Status Updated",
            description: `Auto-trading bot is now ${checked ? 'active' : 'inactive'}`,
          });
        },
        onError: () => {
          toast({
            title: "Error",
            description: "Failed to update bot status",
            variant: "destructive",
          });
        }
      }
    );
  };

  const handleUpdateStrategy = () => {
    if (!strategy) return;
    updateSettingsMutation.mutate(
      { data: { strategy: strategy as UserSettingsInputStrategy } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetSettingsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetBotStatusQueryKey() });
          toast({
            title: "Strategy Updated",
            description: "Bot trading strategy updated successfully",
          });
        },
        onError: () => {
          toast({
            title: "Error",
            description: "Failed to update strategy",
            variant: "destructive",
          });
        }
      }
    );
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Bot Control</h1>
        <p className="text-muted-foreground mt-1">Configure and monitor your automated AI trading bot.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className={`border-2 ${status?.active ? 'border-primary shadow-[0_0_15px_rgba(234,179,8,0.15)]' : 'border-border'} bg-card transition-all duration-500`}>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-xl ${status?.active ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                  <BotIcon className="w-8 h-8" />
                </div>
                <div>
                  <CardTitle className="text-2xl">Main Engine</CardTitle>
                  <CardDescription className="mt-1">
                    {status?.active ? (
                      <span className="text-primary font-medium flex items-center gap-1">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                        </span>
                        ACTIVE & SCANNING
                      </span>
                    ) : (
                      <span className="text-muted-foreground font-medium">OFFLINE</span>
                    )}
                  </CardDescription>
                </div>
              </div>
              {statusLoading ? (
                <Skeleton className="w-12 h-6" />
              ) : (
                <Switch 
                  checked={status?.active || false}
                  onCheckedChange={handleToggleBot}
                  disabled={toggleBotMutation.isPending}
                  className="data-[state=checked]:bg-primary scale-125"
                />
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="p-4 bg-background rounded-lg border border-border">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <Clock className="w-4 h-4" />
                  <span className="text-xs font-medium uppercase tracking-wider">Uptime</span>
                </div>
                <div className="text-2xl font-bold font-mono">
                  {statusLoading ? <Skeleton className="h-8 w-20" /> : `${Math.floor((status?.totalRuntime || 0) / 60)}h ${(status?.totalRuntime || 0) % 60}m`}
                </div>
              </div>
              <div className="p-4 bg-background rounded-lg border border-border">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <Activity className="w-4 h-4" />
                  <span className="text-xs font-medium uppercase tracking-wider">Executed</span>
                </div>
                <div className="text-2xl font-bold font-mono">
                  {statusLoading ? <Skeleton className="h-8 w-16" /> : status?.tradesExecuted || 0}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <div className="flex items-center gap-2 mb-1">
              <Settings2 className="w-5 h-5 text-primary" />
              <CardTitle>Trading Strategy</CardTitle>
            </div>
            <CardDescription>Select the algorithm driving the bot</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Active Strategy</label>
              {settingsLoading ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <Select value={strategy} onValueChange={(v) => setStrategy(v as UserSettingsInputStrategy)}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Select strategy" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={UserSettingsInputStrategy.SCALPING}>Scalping (High Frequency)</SelectItem>
                    <SelectItem value={UserSettingsInputStrategy.SWING}>Swing Trading (Mid Term)</SelectItem>
                    <SelectItem value={UserSettingsInputStrategy.TREND_FOLLOWING}>Trend Following</SelectItem>
                    <SelectItem value={UserSettingsInputStrategy.SMC}>Smart Money Concepts (SMC)</SelectItem>
                    <SelectItem value={UserSettingsInputStrategy.ICT}>Inner Circle Trader (ICT)</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="p-4 rounded-md bg-muted/50 border border-border text-sm text-muted-foreground leading-relaxed">
              <strong>Note:</strong> Changing the strategy while the bot is active will only affect future trades. Open positions will be managed according to the strategy that opened them.
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full" 
              onClick={handleUpdateStrategy}
              disabled={updateSettingsMutation.isPending || !strategy || strategy === settings?.strategy}
            >
              {updateSettingsMutation.isPending ? "Updating..." : "Update Strategy"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
