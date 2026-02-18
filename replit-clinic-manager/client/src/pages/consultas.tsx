import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Search, ClipboardList, Loader2 } from "lucide-react";
import { format } from "date-fns";

const statusLabels: Record<string, string> = {
  AGENDADA: "Agendada", CONFIRMADA: "Confirmada", EM_ATENDIMENTO: "Em Atendimento",
  CONCLUIDA: "Concluida", CANCELADA: "Cancelada", FALTOU: "Faltou",
};
const statusColors: Record<string, string> = {
  AGENDADA: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  CONFIRMADA: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  EM_ATENDIMENTO: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  CONCLUIDA: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  CANCELADA: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  FALTOU: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300",
};

export default function ConsultasPage() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const { data: consultas, isLoading } = useQuery<any[]>({ queryKey: ["/api/consultas"] });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      apiRequest("PATCH", `/api/consultas/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/consultas"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      toast({ title: "Status atualizado" });
    },
    onError: (err: any) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });

  const filtered = consultas?.filter(c => {
    const matchSearch = (c.pacienteNome || "").toLowerCase().includes(search.toLowerCase()) ||
                        (c.colaboradorNome || "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "ALL" || c.status === statusFilter;
    return matchSearch && matchStatus;
  }) || [];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight" data-testid="text-consultas-title">Consultas</h1>
        <p className="text-sm text-muted-foreground mt-1">{filtered.length} consulta(s)</p>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar por paciente ou profissional..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" data-testid="input-search-consulta" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]" data-testid="select-filter-status"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos os status</SelectItem>
            {Object.entries(statusLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <Card><CardContent className="p-6"><div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div></CardContent></Card>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="p-12 text-center"><ClipboardList className="w-12 h-12 mx-auto mb-3 text-muted-foreground/40" /><p className="text-muted-foreground">Nenhuma consulta encontrada</p></CardContent></Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Paciente</TableHead>
                  <TableHead className="hidden md:table-cell">Profissional</TableHead>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead className="hidden md:table-cell">Servico</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Acao</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((c: any) => (
                  <TableRow key={c.id} data-testid={`row-consulta-${c.id}`}>
                    <TableCell className="font-medium">{c.pacienteNome}</TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">{c.colaboradorNome}</TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm">{format(new Date(c.inicio), "dd/MM/yyyy")}</p>
                        <p className="text-xs text-muted-foreground">{format(new Date(c.inicio), "HH:mm")} - {format(new Date(c.fim), "HH:mm")}</p>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">{c.servicoNome}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={statusColors[c.status] || ""}>
                        {statusLabels[c.status] || c.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Select
                        value={c.status}
                        onValueChange={(v) => updateStatusMutation.mutate({ id: c.id, status: v })}
                      >
                        <SelectTrigger className="w-[140px]" data-testid={`select-status-${c.id}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(statusLabels).map(([k, v]) => (
                            <SelectItem key={k} value={k}>{v}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
