import { useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { User as UserIcon, Mail, Shield, Hash, Calendar } from "lucide-react";
import { format } from "date-fns";

export default function Profile() {
  const { data: user, isLoading } = useGetMe({
    query: { queryKey: getGetMeQueryKey() }
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
        <p className="text-muted-foreground mt-1">View your account details and identity.</p>
      </div>

      <Card className="bg-card border-border max-w-2xl">
        <CardHeader>
          <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mb-4">
            <UserIcon className="w-10 h-10 text-primary" />
          </div>
          <CardTitle className="text-2xl">{user?.username}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : user ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-background border border-border">
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Mail className="w-5 h-5" />
                  <span>Email</span>
                </div>
                <span className="font-medium">{user.email}</span>
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg bg-background border border-border">
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Shield className="w-5 h-5" />
                  <span>Role</span>
                </div>
                <span className="font-medium capitalize">{user.role}</span>
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg bg-background border border-border">
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Hash className="w-5 h-5" />
                  <span>Account ID</span>
                </div>
                <span className="font-mono text-sm">{user.id}</span>
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg bg-background border border-border">
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Calendar className="w-5 h-5" />
                  <span>Member Since</span>
                </div>
                <span className="font-medium">{format(new Date(user.createdAt), 'MMMM dd, yyyy')}</span>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
