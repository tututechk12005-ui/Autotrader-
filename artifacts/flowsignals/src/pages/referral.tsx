import { useGetReferral, getGetReferralQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, Copy, DollarSign, Gift } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

export default function Referral() {
  const { toast } = useToast();
  const { data: referralInfo, isLoading } = useGetReferral({
    query: { queryKey: getGetReferralQueryKey() }
  });

  const handleCopy = () => {
    if (!referralInfo) return;
    navigator.clipboard.writeText(referralInfo.referralCode);
    toast({
      title: "Copied!",
      description: "Referral code copied to clipboard",
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Referral Program</h1>
        <p className="text-muted-foreground mt-1">Invite friends and earn a percentage of their trading fees.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-card border-border col-span-1">
          <CardHeader>
            <CardTitle>Your Code</CardTitle>
            <CardDescription>Share this code with friends</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <div className="flex gap-2">
                <Input value={referralInfo?.referralCode || ""} readOnly className="bg-background font-mono text-center font-bold text-lg" />
                <Button variant="outline" size="icon" onClick={handleCopy}>
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card className="bg-card border-border col-span-1">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Referrals</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {isLoading ? <Skeleton className="h-8 w-16" /> : referralInfo?.totalReferrals || 0}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border col-span-1">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Earnings</CardTitle>
            <DollarSign className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-success">
              {isLoading ? <Skeleton className="h-8 w-24" /> : `$${(referralInfo?.totalEarnings || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}`}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Your Network</CardTitle>
          <CardDescription>Users who signed up with your code</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : !referralInfo?.referrals || referralInfo.referrals.length === 0 ? (
            <div className="text-center py-12">
              <Gift className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-1">No referrals yet</h3>
              <p className="text-muted-foreground text-sm">Share your code to start building your network and earning rewards.</p>
            </div>
          ) : (
            <div className="rounded-md border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Joined Date</TableHead>
                    <TableHead className="text-right">Commission Earned</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {referralInfo.referrals.map((ref) => (
                    <TableRow key={ref.id}>
                      <TableCell className="font-medium">{ref.username}</TableCell>
                      <TableCell className="text-muted-foreground">{format(new Date(ref.joinedAt), 'MMM dd, yyyy')}</TableCell>
                      <TableCell className="text-right text-success font-medium">
                        ${ref.commission.toLocaleString(undefined, {minimumFractionDigits: 2})}
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
