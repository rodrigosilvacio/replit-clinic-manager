import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Stethoscope, Loader2 } from "lucide-react";
import type { Servico } from "@shared/schema";

export default function ServicosPage() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ nome: "", duracaoMin: 30, preco: "", descricao: "", ativo: true });

  const { data: servicos, isLoading } = useQuery<Servico[]>({ queryKey: ["/api/servicos"] });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/servicos", data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/servicos"] }); setDialogOpen(false); resetForm(); toast({ title: "Servico cadastrado" }); },
    onError: (err: any) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => apiRequest("PATCH", `/api/servicos/${editId}`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/servicos"] }); setDialogOpen(false); resetForm(); toast({ title: "Servico atualizado" }); },
    onError: (err: any) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });

  const resetForm = () => { setEditId(null); setForm({ nome: "", duracaoMin: 30, preco: "", descricao: "", ativo: true }); };

  const openEdit = (s: Servico) => {
    setEditId(s.id);
    setForm({ nome: s.nome, duracaoMin: s.duracaoMin, preco: String(s.preco), descricao: s.descricao || "", ativo: s.ativo });
    setDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...form, preco: form.preco, descricao: form.descricao || null, duracaoMin: Number(form.duracaoMin) };
    if (editId) updateMutation.mutate(payload); else createMutation.mutate(payload);
  };

  const filtered = servicos?.filter(s => s.nome.toLowerCase().includes(search.toLowerCase())) || [];
  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight" data-testid="text-servicos-title">Servicos</h1>
          <p className="text-sm text-muted-foreground mt-1">{filtered.length} servico(s)</p>
        </div>
        <Button onClick={() => { resetForm(); setDialogOpen(true); }} data-testid="button-add-servico">
          <Plus className="w-4 h-4 mr-2" /> Novo Servico
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Buscar servico..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" data-testid="input-search-servico" />
      </div>

      {isLoading ? (
        <Card><CardContent className="p-6"><div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div></CardContent></Card>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="p-12 text-center"><Stethoscope className="w-12 h-12 mx-auto mb-3 text-muted-foreground/40" /><p className="text-muted-foreground">Nenhum servico encontrado</p></CardContent></Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Duracao</TableHead>
                  <TableHead>Preco</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Acoes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(s => (
                  <TableRow key={s.id} data-testid={`row-servico-${s.id}`}>
                    <TableCell className="font-medium">{s.nome}</TableCell>
                    <TableCell className="text-muted-foreground">{s.duracaoMin} min</TableCell>
                    <TableCell>R$ {Number(s.preco).toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant={s.ativo ? "default" : "secondary"} className={s.ativo ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" : ""}>
                        {s.ativo ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(s)} data-testid={`button-edit-servico-${s.id}`}>Editar</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editId ? "Editar Servico" : "Novo Servico"}</DialogTitle>
            <DialogDescription>Configure o servico ou procedimento</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} required data-testid="input-servico-nome" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Duracao (min) *</Label>
                <Input type="number" min={5} value={form.duracaoMin} onChange={e => setForm({...form, duracaoMin: Number(e.target.value)})} required data-testid="input-servico-duracao" />
              </div>
              <div className="space-y-2">
                <Label>Preco (R$) *</Label>
                <Input type="number" step="0.01" min={0} value={form.preco} onChange={e => setForm({...form, preco: e.target.value})} required data-testid="input-servico-preco" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Descricao</Label>
              <Textarea value={form.descricao} onChange={e => setForm({...form, descricao: e.target.value})} className="resize-none" />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={isPending} data-testid="button-save-servico">
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : editId ? "Salvar" : "Cadastrar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
