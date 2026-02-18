import { useLocation, Link } from "wouter";
import { useAuth } from "@/lib/auth";
import {
  LayoutDashboard,
  Users,
  Calendar,
  ClipboardList,
  FileText,
  Package,
  DollarSign,
  Settings,
  LogOut,
  Stethoscope,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

const menuItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard, roles: ["ADMIN", "RECEPCAO", "PROFISSIONAL_SAUDE", "FINANCEIRO"] },
  { title: "Pacientes", url: "/pacientes", icon: Users, roles: ["ADMIN", "RECEPCAO", "PROFISSIONAL_SAUDE"] },
  { title: "Agenda", url: "/agenda", icon: Calendar, roles: ["ADMIN", "RECEPCAO", "PROFISSIONAL_SAUDE"] },
  { title: "Consultas", url: "/consultas", icon: ClipboardList, roles: ["ADMIN", "RECEPCAO", "PROFISSIONAL_SAUDE"] },
  { title: "Prontuario", url: "/prontuario", icon: FileText, roles: ["ADMIN", "PROFISSIONAL_SAUDE"] },
  { title: "Estoque", url: "/estoque", icon: Package, roles: ["ADMIN", "RECEPCAO"] },
  { title: "Financeiro", url: "/financeiro", icon: DollarSign, roles: ["ADMIN", "FINANCEIRO", "RECEPCAO"] },
  { title: "Configuracoes", url: "/configuracoes", icon: Settings, roles: ["ADMIN"] },
];

export function AppSidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  const visibleItems = menuItems.filter(
    (item) => user && item.roles.includes(user.papel)
  );

  const initials = user?.nome
    ? user.nome
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "?";

  const roleLabel: Record<string, string> = {
    ADMIN: "Administrador",
    RECEPCAO: "Recepcao",
    PROFISSIONAL_SAUDE: "Profissional",
    FINANCEIRO: "Financeiro",
  };

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-md bg-sidebar-primary">
            <Stethoscope className="w-5 h-5 text-sidebar-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-sidebar-foreground">Nina</span>
            <span className="text-xs text-sidebar-foreground/60">Gestao de Clinicas</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/50 text-xs uppercase tracking-wider px-4">
            Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleItems.map((item) => {
                const isActive = location === item.url || (item.url !== "/" && location.startsWith(item.url));
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      data-testid={`nav-${item.title.toLowerCase()}`}
                    >
                      <Link href={item.url}>
                        <item.icon className="w-4 h-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-xs">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col flex-1 min-w-0">
            <span className="text-sm font-medium text-sidebar-foreground truncate">
              {user?.nome}
            </span>
            <span className="text-xs text-sidebar-foreground/60">
              {user ? roleLabel[user.papel] : ""}
            </span>
          </div>
          <Button
            size="icon"
            variant="ghost"
            onClick={logout}
            className="text-sidebar-foreground/60"
            data-testid="button-logout"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
