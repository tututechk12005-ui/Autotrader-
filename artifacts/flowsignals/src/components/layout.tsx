import { ReactNode, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";
import { clearToken } from "@/lib/auth";
import { useQueryClient } from "@tanstack/react-query";
import {
  LayoutDashboard,
  LineChart,
  Activity,
  Scan,
  History,
  Bot,
  Link as LinkIcon,
  Settings,
  Users,
  ShieldAlert,
  User as UserIcon,
  LogOut,
  MoreHorizontal,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [location, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useGetMe({
    query: {
      queryKey: getGetMeQueryKey(),
      retry: false,
    },
  });

  const isAuthPage = location === "/login" || location === "/register";

  useEffect(() => {
    if (!isLoading && !user && !isAuthPage) {
      setLocation("/login");
    }
  }, [isLoading, user, isAuthPage, setLocation]);

  useEffect(() => {
    if (!isLoading && user && isAuthPage) {
      setLocation("/dashboard");
    }
  }, [isLoading, user, isAuthPage, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user && isAuthPage) return <>{children}</>;
  if (!user || isAuthPage) return null;

  const handleLogout = () => {
    clearToken();
    queryClient.clear();
    setLocation("/login");
  };

  const primaryNav = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Demo", href: "/demo", icon: LineChart },
    { name: "Signals", href: "/signals", icon: Activity },
    { name: "Scanner", href: "/scanner", icon: Scan },
    { name: "Trades", href: "/trades", icon: History },
  ];

  const secondaryNav = [
    { name: "Bot Control", href: "/bot", icon: Bot },
    { name: "Connect Binance", href: "/connect", icon: LinkIcon },
    { name: "Settings", href: "/settings", icon: Settings },
    { name: "Referral", href: "/referral", icon: Users },
    { name: "Profile", href: "/profile", icon: UserIcon },
    ...(user.role === "admin" ? [{ name: "Admin", href: "/admin", icon: ShieldAlert }] : []),
  ];

  const allDesktopNav = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Demo Trading", href: "/demo", icon: LineChart },
    { name: "AI Signals", href: "/signals", icon: Activity },
    { name: "Pair Scanner", href: "/scanner", icon: Scan },
    { name: "Trades", href: "/trades", icon: History },
    { name: "Bot Control", href: "/bot", icon: Bot },
    { name: "Connect Binance", href: "/connect", icon: LinkIcon },
    { name: "Settings", href: "/settings", icon: Settings },
    { name: "Referral", href: "/referral", icon: Users },
    ...(user.role === "admin" ? [{ name: "Admin", href: "/admin", icon: ShieldAlert }] : []),
    { name: "Profile", href: "/profile", icon: UserIcon },
  ];

  const isSecondaryActive = secondaryNav.some((item) => location === item.href);

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* ── Desktop Sidebar ── */}
      <aside className="hidden md:flex flex-col w-64 bg-card border-r border-border min-h-screen sticky top-0 overflow-y-auto shrink-0">
        <div className="flex items-center gap-3 p-6 border-b border-border">
          <Activity className="w-8 h-8 text-primary" />
          <span className="font-bold text-xl tracking-wider text-foreground">FLOWSIGNALS</span>
        </div>
        <nav className="flex flex-col gap-1 px-3 py-4 flex-1">
          {allDesktopNav.map((item) => (
            <Link key={item.href} href={item.href}>
              <div
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors cursor-pointer ${
                  location === item.href
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                <span className="font-medium text-sm">{item.name}</span>
              </div>
            </Link>
          ))}
        </nav>
        <div className="px-3 pb-4 border-t border-border pt-4">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-md text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium text-sm">Logout</span>
          </button>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Mobile top bar */}
        <header className="md:hidden flex items-center gap-2 px-4 py-3 border-b border-border bg-card sticky top-0 z-10">
          <Activity className="w-5 h-5 text-primary" />
          <span className="font-bold text-base tracking-wider text-foreground">FLOWSIGNALS AI</span>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 md:p-8 pb-24 md:pb-8">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>

      {/* ── Mobile Bottom Navigation ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border">
        <div className="flex items-center justify-around">
          {primaryNav.map((item) => {
            const active = location === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={`flex flex-col items-center gap-0.5 px-3 py-3 cursor-pointer transition-colors ${
                    active ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  <item.icon className={`w-5 h-5 ${active ? "stroke-[2.5px]" : ""}`} />
                  <span className="text-[10px] font-medium leading-tight">{item.name}</span>
                  {active && (
                    <span className="absolute top-0 h-0.5 w-8 bg-primary rounded-full -translate-y-0 left-1/2 -translate-x-1/2" />
                  )}
                </div>
              </Link>
            );
          })}

          {/* "More" dropdown for secondary nav items */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div
                className={`flex flex-col items-center gap-0.5 px-3 py-3 cursor-pointer transition-colors ${
                  isSecondaryActive ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <MoreHorizontal className="w-5 h-5" />
                <span className="text-[10px] font-medium leading-tight">More</span>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              side="top"
              className="mb-2 w-48 bg-card border-border"
            >
              {secondaryNav.map((item) => (
                <DropdownMenuItem key={item.href} asChild>
                  <Link href={item.href}>
                    <div
                      className={`flex items-center gap-3 w-full cursor-pointer ${
                        location === item.href ? "text-primary" : ""
                      }`}
                    >
                      <item.icon className="w-4 h-4" />
                      <span className="text-sm">{item.name}</span>
                    </div>
                  </Link>
                </DropdownMenuItem>
              ))}
              <DropdownMenuItem
                onClick={handleLogout}
                className="flex items-center gap-3 text-destructive cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm">Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </nav>
    </div>
  );
}
