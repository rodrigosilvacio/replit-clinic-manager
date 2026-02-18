import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { Search, FileText, Plus, Loader2 } from "lucide-react";
import { format } from "date-fns";

const tipoLabels: Record<string, string> = {
  ANAMNESE: "Anamnese", EVOLUCAO: "Evolucao", PRESCRICAO: "Prescricao",
  ATESTADO: "Atestado", EXAME: "Exame", OUTRO: "Outro",
};

export default function ProntuarioPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedConsultaId, setSelectedConsultaId] = useState<number | null>(null);
  const [form, setForm] = useState({ tipo: "EVOLUCAO" as string, texto: "" });

  const { data: registros, isLoading } = useQuery<any[]>({ queryKey: ["/api/prontuarios"] });
  const { data: consultas } = useQuery<any[]>({ queryKey: ["/api/consultas"] });

  const consultasConcluidas = consultas?.filter(c => c.status === "CONCLUIDA") || [];

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/prontuarios", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/prontuarios"] });
      setDialogOpen(false);
      setForm({ tipo: "EVOLUCAO", texto: "" });
      toast({ title: "Registro adicionado ao prontuario" });
    },
    onError: (err: any) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConsultaId) return;
    createMutation.mutate({
      consultaId: selectedConsultaId,
      tipo: form.tipo,
      texto: form.texto,
      criadoPor: user?.id,
    });
  };

  const filtered = registros?.filter(r =>
    (r.pacienteNome || "").toLowerCase().includes(search.toLowerCase()) ||
    (r.texto || "").toLowerCase().includes(search.toLowerCase())
  ) || [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight" data-testid="text-prontuario-title">Prontuario Eletronico</h1>
          <p className="text-sm text-muted-foreground mt-1">Registros clinicos dos pacientes</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} data-testid="button-add-prontuario">
          <Plus className="w-4 h-4 mr-2" /> Novo Registro
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Buscar no prontuario..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" data-testid="input-search-prontuario" />
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-24 w-full" />)}</div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="p-12 text-center"><FileText className="w-12 h-12 mx-auto mb-3 text-muted-foreground/40" /><p className="text-muted-foreground">Nenhum registro encontrado</p></CardContent></Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((r: any) => (
            <Card key={r.id} data-testid={`card-prontuario-${r.id}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <Badge variant="secondary">{tipoLabels[r.tipo] || r.tipo}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(r.createdAt), "dd/MM/yyyy HH:mm")}
                      </span>
                    </div>
                    <p className="text-sm font-medium mb-1">{r.pacienteNome}</p>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{r.texto}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Profissional: {r.colaboradorNome}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Novo Registro Clinico</DialogTitle>
            <DialogDescription>Adicione informacoes ao prontuario</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Consulta *</Label>
              <Select value={selectedConsultaId ? String(selectedConsultaId) : ""} onValueChange={v => setSelectedConsultaId(Number(v))}>
                <SelectTrigger data-testid="select-prontuario-consulta"><SelectValue placeholder="Selecionar consulta concluida" /></SelectTrigger>
                <SelectContent>
                  {consultasConcluidas.map(c => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.pacienteNome} - {format(new Date(c.inicio), "dd/MM/yyyy HH:mm")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tipo *</Label>
              <Select value={form.tipo} onValueChange={v => setForm({...form, tipo: v})}>
                <SelectTrigger data-testid="select-prontuario-tipo"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(tipoLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Texto *</Label>
              <Textarea value={form.texto} onChange={e => setForm({...form, texto: e.target.value})} rows={6} required className="resize-none" data-testid="textarea-prontuario-texto" />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={createMutation.isPending} data-testid="button-save-prontuario">
                {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Salvar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
