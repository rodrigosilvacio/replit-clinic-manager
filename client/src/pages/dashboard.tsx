import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  Calendar,
  DollarSign,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  TrendingUp,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DashboardData {
  totalPacientes: number;
  consultasHoje: number;
  receitaMes: number;
  estoqueCritico: number;
  proximasConsultas: any[];
  consultasRecentes: any[];
}

export default function DashboardPage() {
  const { data, isLoading } = useQuery<DashboardData>({
    queryKey: ["/api/dashboard"],
  });

  const statusColors: Record<string, string> = {
    AGENDADA: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    CONFIRMADA: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
    EM_ATENDIMENTO: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    CONCLUIDA: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
    CANCELADA: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
    FALTOU: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300",
  };

  const statusLabel: Record<string, string> = {
    AGENDADA: "Agendada",
    CONFIRMADA: "Confirmada",
    EM_ATENDIMENTO: "Em Atendimento",
    CONCLUIDA: "Concluida",
    CANCELADA: "Cancelada",
    FALTOU: "Faltou",
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const stats = [
    {
      title: "Total Pacientes",
      value: data?.totalPacientes || 0,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
    },
    {
      title: "Consultas Hoje",
      value: data?.consultasHoje || 0,
      icon: Calendar,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50 dark:bg-emerald-900/20",
    },
    {
      title: "Receita do Mes",
      value: `R$ ${Number(data?.receitaMes || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-900/20",
    },
    {
      title: "Estoque Critico",
      value: data?.estoqueCritico || 0,
      icon: AlertTriangle,
      color: "text-amber-600",
      bgColor: "bg-amber-50 dark:bg-amber-900/20",
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight" data-testid="text-dashboard-title">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {format(new Date(), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-semibold mt-1" data-testid={`text-stat-${stat.title.toLowerCase().replace(/ /g, "-")}`}>
                    {stat.value}
                  </p>
                </div>
                <div className={`p-3 rounded-md ${stat.bgColor}`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-4">
            <CardTitle className="text-base font-semibold">Proximas Consultas</CardTitle>
            <Clock className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {data?.proximasConsultas && data.proximasConsultas.length > 0 ? (
              <div className="space-y-3">
                {data.proximasConsultas.map((c: any) => (
                  <div key={c.id} className="flex items-center justify-between gap-3 p-3 rounded-md bg-muted/50">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{c.pacienteNome}</p>
                      <p className="text-xs text-muted-foreground">
                        {c.servicoNome} - {c.colaboradorNome}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-medium">
                        {format(new Date(c.inicio), "HH:mm")}
                      </p>
                      <Badge variant="secondary" className={`text-xs ${statusColors[c.status] || ""}`}>
                        {statusLabel[c.status] || c.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="w-10 h-10 mx-auto mb-2 opacity-40" />
                <p className="text-sm">Nenhuma consulta agendada para hoje</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-4">
            <CardTitle className="text-base font-semibold">Atividade Recente</CardTitle>
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {data?.consultasRecentes && data.consultasRecentes.length > 0 ? (
              <div className="space-y-3">
                {data.consultasRecentes.map((c: any) => (
                  <div key={c.id} className="flex items-center gap-3 p-3 rounded-md bg-muted/50">
                    <div className={`p-2 rounded-md ${c.status === "CONCLUIDA" ? "bg-green-50 dark:bg-green-900/20" : c.status === "CANCELADA" || c.status === "FALTOU" ? "bg-red-50 dark:bg-red-900/20" : "bg-blue-50 dark:bg-blue-900/20"}`}>
                      {c.status === "CONCLUIDA" ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : c.status === "CANCELADA" || c.status === "FALTOU" ? (
                        <XCircle className="w-4 h-4 text-red-600" />
                      ) : (
                        <Clock className="w-4 h-4 text-blue-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{c.pacienteNome}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(c.inicio), "dd/MM HH:mm")} - {c.servicoNome}
                      </p>
                    </div>
                    <Badge variant="secondary" className={`text-xs shrink-0 ${statusColors[c.status] || ""}`}>
                      {statusLabel[c.status] || c.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <ClipboardList className="w-10 h-10 mx-auto mb-2 opacity-40" />
                <p className="text-sm">Nenhuma atividade recente</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ClipboardList(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <path d="M12 11h4" /><path d="M12 16h4" /><path d="M8 11h.01" /><path d="M8 16h.01" />
    </svg>
  );
}
