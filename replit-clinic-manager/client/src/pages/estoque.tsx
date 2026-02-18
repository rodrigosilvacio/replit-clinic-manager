import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Package, ArrowUpCircle, ArrowDownCircle, Loader2, AlertTriangle } from "lucide-react";
import type { ItemEstoque } from "@shared/schema";
import { format } from "date-fns";

export default function EstoquePage() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [movDialogOpen, setMovDialogOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ nome: "", sku: "", unidade: "UN", estoqueMinimo: 5, quantidadeAtual: 0, ativo: true });
  const [movForm, setMovForm] = useState({ itemId: "", tipo: "ENTRADA" as string, quantidade: 1, motivo: "" });

  const { data: itens, isLoading } = useQuery<ItemEstoque[]>({ queryKey: ["/api/estoque"] });
  const { data: movimentacoes } = useQuery<any[]>({ queryKey: ["/api/estoque/movimentacoes"] });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/estoque", data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/estoque"] }); setDialogOpen(false); resetForm(); toast({ title: "Item cadastrado" }); },
    onError: (err: any) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => apiRequest("PATCH", `/api/estoque/${editId}`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/estoque"] }); setDialogOpen(false); resetForm(); toast({ title: "Item atualizado" }); },
    onError: (err: any) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });

  const movMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/estoque/movimentacoes", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/estoque"] });
      queryClient.invalidateQueries({ queryKey: ["/api/estoque/movimentacoes"] });
      setMovDialogOpen(false);
      toast({ title: "Movimentacao registrada" });
    },
    onError: (err: any) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });

  const resetForm = () => { setEditId(null); setForm({ nome: "", sku: "", unidade: "UN", estoqueMinimo: 5, quantidadeAtual: 0, ativo: true }); };

  const openEdit = (item: ItemEstoque) => {
    setEditId(item.id);
    setForm({ nome: item.nome, sku: item.sku || "", unidade: item.unidade, estoqueMinimo: item.estoqueMinimo, quantidadeAtual: item.quantidadeAtual, ativo: item.ativo });
    setDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...form, sku: form.sku || null, estoqueMinimo: Number(form.estoqueMinimo), quantidadeAtual: Number(form.quantidadeAtual) };
    if (editId) updateMutation.mutate(payload); else createMutation.mutate(payload);
  };

  const handleMovSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    movMutation.mutate({ itemId: Number(movForm.itemId), tipo: movForm.tipo, quantidade: Number(movForm.quantidade), motivo: movForm.motivo || null });
  };

  const filtered = itens?.filter(i => i.nome.toLowerCase().includes(search.toLowerCase())) || [];
  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight" data-testid="text-estoque-title">Estoque</h1>
          <p className="text-sm text-muted-foreground mt-1">{filtered.length} item(ns)</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" onClick={() => setMovDialogOpen(true)} data-testid="button-movimentacao">
            <ArrowUpCircle className="w-4 h-4 mr-2" /> Movimentacao
          </Button>
          <Button onClick={() => { resetForm(); setDialogOpen(true); }} data-testid="button-add-item">
            <Plus className="w-4 h-4 mr-2" /> Novo Item
          </Button>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Buscar item..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" data-testid="input-search-estoque" />
      </div>

      {isLoading ? (
        <Card><CardContent className="p-6"><div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div></CardContent></Card>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="p-12 text-center"><Package className="w-12 h-12 mx-auto mb-3 text-muted-foreground/40" /><p className="text-muted-foreground">Nenhum item no estoque</p></CardContent></Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Unidade</TableHead>
                  <TableHead>Quantidade</TableHead>
                  <TableHead>Min.</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Acoes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(item => {
                  const isCritical = item.quantidadeAtual <= item.estoqueMinimo;
                  return (
                    <TableRow key={item.id} data-testid={`row-estoque-${item.id}`}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{item.nome}</p>
                          {item.sku && <p className="text-xs text-muted-foreground">SKU: {item.sku}</p>}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{item.unidade}</TableCell>
                      <TableCell>
                        <span className={`font-medium ${isCritical ? "text-red-600" : ""}`}>
                          {item.quantidadeAtual}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{item.estoqueMinimo}</TableCell>
                      <TableCell>
                        {isCritical ? (
                          <Badge variant="destructive" className="gap-1">
                            <AlertTriangle className="w-3 h-3" /> Critico
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">Normal</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(item)}>Editar</Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editId ? "Editar Item" : "Novo Item"}</DialogTitle>
            <DialogDescription>Configure o item do estoque</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2"><Label>Nome *</Label><Input value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} required data-testid="input-item-nome" /></div>
            <div className="space-y-2"><Label>SKU</Label><Input value={form.sku} onChange={e => setForm({...form, sku: e.target.value})} /></div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2"><Label>Unidade</Label><Input value={form.unidade} onChange={e => setForm({...form, unidade: e.target.value})} /></div>
              <div className="space-y-2"><Label>Qtd. Atual</Label><Input type="number" min={0} value={form.quantidadeAtual} onChange={e => setForm({...form, quantidadeAtual: Number(e.target.value)})} /></div>
              <div className="space-y-2"><Label>Min.</Label><Input type="number" min={0} value={form.estoqueMinimo} onChange={e => setForm({...form, estoqueMinimo: Number(e.target.value)})} /></div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={isPending}>{isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : editId ? "Salvar" : "Cadastrar"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={movDialogOpen} onOpenChange={setMovDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nova Movimentacao</DialogTitle>
            <DialogDescription>Registre entrada ou saida de estoque</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleMovSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Item *</Label>
              <Select value={movForm.itemId} onValueChange={v => setMovForm({...movForm, itemId: v})}>
                <SelectTrigger data-testid="select-mov-item"><SelectValue placeholder="Selecionar item" /></SelectTrigger>
                <SelectContent>{itens?.map(i => <SelectItem key={i.id} value={String(i.id)}>{i.nome}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tipo *</Label>
              <Select value={movForm.tipo} onValueChange={v => setMovForm({...movForm, tipo: v})}>
                <SelectTrigger data-testid="select-mov-tipo"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ENTRADA">Entrada</SelectItem>
                  <SelectItem value="SAIDA">Saida</SelectItem>
                  <SelectItem value="AJUSTE">Ajuste</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Quantidade *</Label><Input type="number" min={1} value={movForm.quantidade} onChange={e => setMovForm({...movForm, quantidade: Number(e.target.value)})} required data-testid="input-mov-quantidade" /></div>
            <div className="space-y-2"><Label>Motivo</Label><Input value={movForm.motivo} onChange={e => setMovForm({...movForm, motivo: e.target.value})} /></div>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setMovDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={movMutation.isPending}>
                {movMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Registrar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
