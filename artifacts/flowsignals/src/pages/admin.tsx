import { 
  useAdminGetUsers, 
  getAdminGetUsersQueryKey,
  useAdminToggleUser,
  useAdminGetStats,
  getAdminGetStatsQueryKey,
  useAdminToggleBot
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ShieldAlert, Users, Power, Activity } from "lucide-react";

export default function Admin() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: stats, isLoading: statsLoading } = useAdminGetStats({
    query: { queryKey: getAdminGetStatsQueryKey() }
  });

  const { data: users, isLoading: usersLoading } = useAdminGetUsers({
    query: { queryKey: getAdminGetUsersQueryKey() }
  });

  const toggleUserMutation = useAdminToggleUser();
  const toggleGlobalBotMutation = useAdminToggleBot();

  const handleToggleUser = (userId: number, checked: boolean) => {
    toggleUserMutation.mutate(
      { id: userId },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getAdminGetUsersQueryKey() });
          toast({ title: "User Updated", description: "User status has been updated." });
        },
        onError: () => {
          toast({ title: "Error", description: "Failed to update user.", variant: "destructive" });
        }
      }
    );
  };

  const handleToggleGlobalBot = (checked: boolean) => {
    toggleGlobalBotMutation.mutate(
      { data: { active: checked } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getAdminGetStatsQueryKey() });
          toast({ title: "Global Bot Updated", description: `Trading engine is now ${checked ? 'enabled' : 'disabled'} globally.` });
        },
        onError: () => {
          toast({ title: "Error", description: "Failed to update global bot status.", variant: "destructive" });
        }
      }
    );
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <ShieldAlert className="w-8 h-8 text-destructive" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Administration</h1>
          <p className="text-muted-foreground mt-1">Global platform controls and user management.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statsLoading ? <Skeleton className="h-8 w-16" /> : stats?.totalUsers}</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{statsLoading ? <Skeleton className="h-8 w-16" /> : stats?.activeUsers}</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Platform PnL</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats?.platformPnl && stats.platformPnl > 0 ? 'text-success' : 'text-destructive'}`}>
              {statsLoading ? <Skeleton className="h-8 w-24" /> : `$${(stats?.platformPnl || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}`}
            </div>
          </CardContent>
        </Card>
        <Card className={`border-2 ${stats?.botGlobalActive ? 'border-primary' : 'border-border'} bg-card`}>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">Global Trading Engine</CardTitle>
            <Power className={`w-4 h-4 ${stats?.botGlobalActive ? 'text-primary' : 'text-muted-foreground'}`} />
          </CardHeader>
          <CardContent className="flex items-center justify-between mt-2">
            <span className={`text-sm font-bold ${stats?.botGlobalActive ? 'text-primary' : 'text-muted-foreground'}`}>
              {stats?.botGlobalActive ? 'ONLINE' : 'OFFLINE'}
            </span>
            {statsLoading ? <Skeleton className="w-10 h-6" /> : (
              <Switch 
                checked={stats?.botGlobalActive || false}
                onCheckedChange={handleToggleGlobalBot}
                disabled={toggleGlobalBotMutation.isPending}
                className="data-[state=checked]:bg-primary"
              />
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>Manage platform access and roles</CardDescription>
        </CardHeader>
        <CardContent>
          {usersLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <div className="rounded-md border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Access</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users?.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-mono text-muted-foreground">{user.id}</TableCell>
                      <TableCell className="font-medium">{user.username}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge variant={user.role === 'admin' ? 'default' : 'secondary'} className={user.role === 'admin' ? 'bg-primary text-primary-foreground' : ''}>
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{format(new Date(user.createdAt), 'yyyy-MM-dd')}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={user.isActive ? 'text-success border-success' : 'text-destructive border-destructive'}>
                          {user.isActive ? 'Active' : 'Disabled'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Switch 
                          checked={user.isActive}
                          onCheckedChange={(c) => handleToggleUser(user.id, c)}
                          disabled={user.role === 'admin' || toggleUserMutation.isPending}
                        />
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
