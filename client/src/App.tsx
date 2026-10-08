import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Dashboard from "./pages/Dashboard";
import RiskList from "./pages/RiskList";
import RiskForm from "./pages/RiskForm";
import RiskDetail from "./pages/RiskDetail";
import ActionPlan from "./pages/ActionPlan";
import Login from "./pages/Login";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/login" component={Login} />
      <Route path="/riscos" component={RiskList} />
      <Route path="/riscos/novo" component={RiskForm} />
      <Route path="/riscos/:id/editar" component={RiskForm} />
      <Route path="/riscos/:id" component={RiskDetail} />
      <Route path="/plano-de-acao" component={ActionPlan} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster richColors position="top-right" />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
