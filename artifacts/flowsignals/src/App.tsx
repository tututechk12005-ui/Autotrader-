import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/layout";

// Pages
import Login from "@/pages/login";
import Register from "@/pages/register";
import Dashboard from "@/pages/dashboard";
import Demo from "@/pages/demo";
import Signals from "@/pages/signals";
import Scanner from "@/pages/scanner";
import Trades from "@/pages/trades";
import BotPage from "@/pages/bot";
import Settings from "@/pages/settings";
import Connect from "@/pages/connect";
import Referral from "@/pages/referral";
import Admin from "@/pages/admin";
import Profile from "@/pages/profile";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />
        <Route path="/" component={Dashboard} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/demo" component={Demo} />
        <Route path="/signals" component={Signals} />
        <Route path="/scanner" component={Scanner} />
        <Route path="/trades" component={Trades} />
        <Route path="/bot" component={BotPage} />
        <Route path="/settings" component={Settings} />
        <Route path="/connect" component={Connect} />
        <Route path="/referral" component={Referral} />
        <Route path="/admin" component={Admin} />
        <Route path="/profile" component={Profile} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
