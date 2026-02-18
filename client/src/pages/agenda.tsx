import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, ChevronRight, Plus, Clock, User, Loader2 } from "lucide-react";
import { format, addDays, startOfWeek, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Consulta, Paciente, Colaborador, Servico } from "@shared/schema";

export default function AgendaPage() {
  const { toast } = useToast();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    pacienteId: "", colaboradorId: "", servicoId: "", data: format(new Date(), "yyyy-MM-dd"),
    hora: "09:00", observacoes: "",
  });

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const { data: consultas, isLoading } = useQuery<any[]>({
    queryKey: ["/api/consultas"],
  });
  const { data: pacientes } = useQuery<Paciente[]>({ queryKey: ["/api/pacientes"] });
  const { data: colaboradores } = useQuery<Colaborador[]>({ queryKey: ["/api/colaboradores"] });
  const { data: servicos } = useQuery<Servico[]>({ queryKey: ["/api/servicos"] });

  const profissionais = colaboradores?.filter(c => c.papel === "PROFISSIONAL_SAUDE" && c.ativo) || [];

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/consultas", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/consultas"] });
      setDialogOpen(false);
      toast({ title: "Consulta agendada com sucesso" });
    },
    onError: (err: any) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const servico = servicos?.find(s => s.id === Number(form.servicoId));
    const duracao = servico?.duracaoMin || 30;
    const inicio = new Date(`${form.data}T${form.hora}:00`);
    const fim = new Date(inicio.getTime() + duracao * 60000);
    createMutation.mutate({
      pacienteId: Number(form.pacienteId),
      colaboradorId: Number(form.colaboradorId),
      servicoId: Number(form.servicoId),
      inicio: inicio.toISOString(),
      fim: fim.toISOString(),
      status: "AGENDADA",
      observacoes: form.observacoes || null,
      encaixe: false,
      salaId: null,
    });
  };

  const consultasByDay = useMemo(() => {
    const map: Record<string, any[]> = {};
    weekDays.forEach(d => { map[format(d, "yyyy-MM-dd")] = []; });
    consultas?.forEach(c => {
      const key = format(new Date(c.inicio), "yyyy-MM-dd");
      if (map[key]) map[key].push(c);
    });
    return map;
  }, [consultas, weekDays]);

  const statusColors: Record<string, string> = {
    AGENDADA: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    CONFIRMADA: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
    EM_ATENDIMENTO: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    CONCLUIDA: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
    CANCELADA: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
    FALTOU: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300",
  };

  const hours = Array.from({ length: 12 }, (_, i) => `${String(i + 7).padStart(2, "0")}:00`);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight" data-testid="text-agenda-title">Agenda</h1>
          <p className="text-sm text-muted-foreground mt-1">Visualize e gerencie os agendamentos</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} data-testid="button-add-consulta">
          <Plus className="w-4 h-4 mr-2" /> Nova Consulta
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 pb-4">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" onClick={() => setCurrentDate(d => addDays(d, -7))} data-testid="button-prev-week">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <CardTitle className="text-base font-semibold">
              {format(weekStart, "dd MMM", { locale: ptBR })} - {format(addDays(weekStart, 6), "dd MMM yyyy", { locale: ptBR })}
            </CardTitle>
            <Button variant="outline" size="icon" onClick={() => setCurrentDate(d => addDays(d, 7))} data-testid="button-next-week">
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())} data-testid="button-today">
            Hoje
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-20 w-full" />)}</div>
          ) : (
            <div className="grid grid-cols-7 gap-2">
              {weekDays.map((day) => {
                const key = format(day, "yyyy-MM-dd");
                const dayConsultas = consultasByDay[key] || [];
                const isToday = isSameDay(day, new Date());
                return (
                  <div key={key} className={`min-h-[200px] rounded-md border p-2 ${isToday ? "border-primary/50 bg-primary/5" : "border-border"}`}>
                    <div className={`text-center mb-2 pb-2 border-b ${isToday ? "border-primary/30" : "border-border"}`}>
                      <p className="text-xs text-muted-foreground uppercase">
                        {format(day, "EEE", { locale: ptBR })}
                      </p>
                      <p className={`text-lg font-semibold ${isToday ? "text-primary" : ""}`}>
                        {format(day, "dd")}
                      </p>
                    </div>
                    <div className="space-y-1">
                      {dayConsultas.map((c: any) => (
                        <div key={c.id} className={`p-2 rounded-md text-xs ${statusColors[c.status] || "bg-muted"}`} data-testid={`agenda-item-${c.id}`}>
                          <div className="flex items-center gap-1 font-medium">
                            <Clock className="w-3 h-3 shrink-0" />
                            {format(new Date(c.inicio), "HH:mm")}
                          </div>
                          <p className="truncate mt-0.5">{c.pacienteNome || "Paciente"}</p>
                        </div>
                      ))}
                      {dayConsultas.length === 0 && (
                        <p className="text-xs text-muted-foreground text-center py-4">-</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nova Consulta</DialogTitle>
            <DialogDescription>Agende uma nova consulta</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Paciente *</Label>
              <Select value={form.pacienteId} onValueChange={v => setForm({...form, pacienteId: v})}>
                <SelectTrigger data-testid="select-consulta-paciente"><SelectValue placeholder="Selecionar paciente" /></SelectTrigger>
                <SelectContent>
                  {pacientes?.map(p => <SelectItem key={p.id} value={String(p.id)}>{p.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Profissional *</Label>
              <Select value={form.colaboradorId} onValueChange={v => setForm({...form, colaboradorId: v})}>
                <SelectTrigger data-testid="select-consulta-profissional"><SelectValue placeholder="Selecionar profissional" /></SelectTrigger>
                <SelectContent>
                  {profissionais.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Servico *</Label>
              <Select value={form.servicoId} onValueChange={v => setForm({...form, servicoId: v})}>
                <SelectTrigger data-testid="select-consulta-servico"><SelectValue placeholder="Selecionar servico" /></SelectTrigger>
                <SelectContent>
                  {servicos?.filter(s => s.ativo).map(s => <SelectItem key={s.id} value={String(s.id)}>{s.nome} ({s.duracaoMin}min - R${Number(s.preco).toFixed(2)})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data *</Label>
                <Input type="date" value={form.data} onChange={e => setForm({...form, data: e.target.value})} required data-testid="input-consulta-data" />
              </div>
              <div className="space-y-2">
                <Label>Hora *</Label>
                <Input type="time" value={form.hora} onChange={e => setForm({...form, hora: e.target.value})} required data-testid="input-consulta-hora" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Observacoes</Label>
              <Input value={form.observacoes} onChange={e => setForm({...form, observacoes: e.target.value})} />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={createMutation.isPending} data-testid="button-save-consulta">
                {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Agendar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
