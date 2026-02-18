import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Loader2 } from "lucide-react";
import NotFound from "@/pages/not-found";
import LoginPage from "@/pages/login";
import DashboardPage from "@/pages/dashboard";
import PacientesPage from "@/pages/pacientes";
import ColaboradoresPage from "@/pages/colaboradores";
import ServicosPage from "@/pages/servicos";
import AgendaPage from "@/pages/agenda";
import ConsultasPage from "@/pages/consultas";
import ProntuarioPage from "@/pages/prontuario";
import EstoquePage from "@/pages/estoque";
import FinanceiroPage from "@/pages/financeiro";
import ConfiguracoesPage from "@/pages/configuracoes";

function Router() {
  return (
    <Switch>
      <Route path="/" component={DashboardPage} />
      <Route path="/pacientes" component={PacientesPage} />
      <Route path="/colaboradores" component={ColaboradoresPage} />
      <Route path="/servicos" component={ServicosPage} />
      <Route path="/agenda" component={AgendaPage} />
      <Route path="/consultas" component={ConsultasPage} />
      <Route path="/prontuario" component={ProntuarioPage} />
      <Route path="/estoque" component={EstoquePage} />
      <Route path="/financeiro" component={FinanceiroPage} />
      <Route path="/configuracoes" component={ConfiguracoesPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AuthenticatedLayout() {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3.5rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 min-w-0">
          <header className="flex items-center gap-2 p-3 border-b bg-card shrink-0">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
          </header>
          <main className="flex-1 overflow-auto bg-background">
            <Router />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function AppContent() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return <AuthenticatedLayout />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
