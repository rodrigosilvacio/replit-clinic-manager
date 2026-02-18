import { useState } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Plus, DollarSign, TrendingUp, TrendingDown, Loader2, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { format } from "date-fns";
import type { Recebimento, Pagamento } from "@shared/schema";

const formaPagLabels: Record<string, string> = {
  PIX: "PIX", CARTAO: "Cartao", DINHEIRO: "Dinheiro", BOLETO: "Boleto", TRANSFERENCIA: "Transferencia",
};

export default function FinanceiroPage() {
  const { toast } = useToast();
  const [recDialogOpen, setRecDialogOpen] = useState(false);
  const [pagDialogOpen, setPagDialogOpen] = useState(false);
  const [recForm, setRecForm] = useState({ descricao: "", valor: "", formaPagamento: "PIX" as string, status: "PENDENTE" as string, dataCompetencia: format(new Date(), "yyyy-MM-dd"), dataPagamento: "", pacienteId: null as number | null, consultaId: null as number | null });
  const [pagForm, setPagForm] = useState({ descricao: "", valor: "", categoria: "", status: "PENDENTE" as string, dataCompetencia: format(new Date(), "yyyy-MM-dd"), dataPagamento: "" });

  const { data: recebimentos, isLoading: loadingRec } = useQuery<Recebimento[]>({ queryKey: ["/api/financeiro/recebimentos"] });
  const { data: pagamentos, isLoading: loadingPag } = useQuery<Pagamento[]>({ queryKey: ["/api/financeiro/pagamentos"] });

  const createRecMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/financeiro/recebimentos", data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/financeiro/recebimentos"] }); setRecDialogOpen(false); toast({ title: "Recebimento cadastrado" }); },
    onError: (err: any) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });

  const createPagMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/financeiro/pagamentos", data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/financeiro/pagamentos"] }); setPagDialogOpen(false); toast({ title: "Pagamento cadastrado" }); },
    onError: (err: any) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });

  const totalRecebido = recebimentos?.filter(r => r.status === "PAGO").reduce((sum, r) => sum + Number(r.valor), 0) || 0;
  const totalPendente = recebimentos?.filter(r => r.status === "PENDENTE").reduce((sum, r) => sum + Number(r.valor), 0) || 0;
  const totalPago = pagamentos?.filter(p => p.status === "PAGO").reduce((sum, p) => sum + Number(p.valor), 0) || 0;

  const handleRecSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createRecMutation.mutate({
      ...recForm,
      dataPagamento: recForm.dataPagamento || null,
    });
  };

  const handlePagSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createPagMutation.mutate({
      ...pagForm,
      categoria: pagForm.categoria || null,
      dataPagamento: pagForm.dataPagamento || null,
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight" data-testid="text-financeiro-title">Financeiro</h1>
        <p className="text-sm text-muted-foreground mt-1">Gestao de receitas e despesas</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm text-muted-foreground">Recebido</p>
                <p className="text-2xl font-semibold text-green-600 mt-1">
                  R$ {totalRecebido.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="p-3 rounded-md bg-green-50 dark:bg-green-900/20">
                <ArrowUpRight className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm text-muted-foreground">A Receber</p>
                <p className="text-2xl font-semibold text-amber-600 mt-1">
                  R$ {totalPendente.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="p-3 rounded-md bg-amber-50 dark:bg-amber-900/20">
                <TrendingUp className="w-5 h-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm text-muted-foreground">Total Pago</p>
                <p className="text-2xl font-semibold text-red-600 mt-1">
                  R$ {totalPago.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="p-3 rounded-md bg-red-50 dark:bg-red-900/20">
                <ArrowDownRight className="w-5 h-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="recebimentos">
        <TabsList>
          <TabsTrigger value="recebimentos" data-testid="tab-recebimentos">Recebimentos</TabsTrigger>
          <TabsTrigger value="pagamentos" data-testid="tab-pagamentos">Pagamentos</TabsTrigger>
        </TabsList>

        <TabsContent value="recebimentos" className="mt-4">
          <div className="flex justify-end mb-4">
            <Button onClick={() => setRecDialogOpen(true)} data-testid="button-add-recebimento">
              <Plus className="w-4 h-4 mr-2" /> Novo Recebimento
            </Button>
          </div>
          {loadingRec ? (
            <Card><CardContent className="p-6"><div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div></CardContent></Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Descricao</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead className="hidden md:table-cell">Forma</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden md:table-cell">Data</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recebimentos?.map(r => (
                      <TableRow key={r.id} data-testid={`row-recebimento-${r.id}`}>
                        <TableCell className="font-medium">{r.descricao}</TableCell>
                        <TableCell>R$ {Number(r.valor).toFixed(2)}</TableCell>
                        <TableCell className="hidden md:table-cell"><Badge variant="secondary">{formaPagLabels[r.formaPagamento]}</Badge></TableCell>
                        <TableCell>
                          <Badge variant={r.status === "PAGO" ? "default" : "secondary"}
                            className={r.status === "PAGO" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" : r.status === "ESTORNADO" ? "bg-red-100 text-red-700" : ""}>
                            {r.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground">{r.dataCompetencia}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="pagamentos" className="mt-4">
          <div className="flex justify-end mb-4">
            <Button onClick={() => setPagDialogOpen(true)} data-testid="button-add-pagamento">
              <Plus className="w-4 h-4 mr-2" /> Novo Pagamento
            </Button>
          </div>
          {loadingPag ? (
            <Card><CardContent className="p-6"><div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div></CardContent></Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Descricao</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead className="hidden md:table-cell">Categoria</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden md:table-cell">Data</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pagamentos?.map(p => (
                      <TableRow key={p.id} data-testid={`row-pagamento-${p.id}`}>
                        <TableCell className="font-medium">{p.descricao}</TableCell>
                        <TableCell>R$ {Number(p.valor).toFixed(2)}</TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground">{p.categoria || "-"}</TableCell>
                        <TableCell>
                          <Badge variant={p.status === "PAGO" ? "default" : "secondary"}
                            className={p.status === "PAGO" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" : ""}>
                            {p.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground">{p.dataCompetencia}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={recDialogOpen} onOpenChange={setRecDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Novo Recebimento</DialogTitle><DialogDescription>Registre um novo recebimento</DialogDescription></DialogHeader>
          <form onSubmit={handleRecSubmit} className="space-y-4">
            <div className="space-y-2"><Label>Descricao *</Label><Input value={recForm.descricao} onChange={e => setRecForm({...recForm, descricao: e.target.value})} required data-testid="input-rec-descricao" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Valor *</Label><Input type="number" step="0.01" min={0} value={recForm.valor} onChange={e => setRecForm({...recForm, valor: e.target.value})} required data-testid="input-rec-valor" /></div>
              <div className="space-y-2">
                <Label>Forma Pagamento</Label>
                <Select value={recForm.formaPagamento} onValueChange={v => setRecForm({...recForm, formaPagamento: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(formaPagLabels).map(([k,v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={recForm.status} onValueChange={v => setRecForm({...recForm, status: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="PENDENTE">Pendente</SelectItem><SelectItem value="PAGO">Pago</SelectItem><SelectItem value="ESTORNADO">Estornado</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Data Competencia *</Label><Input type="date" value={recForm.dataCompetencia} onChange={e => setRecForm({...recForm, dataCompetencia: e.target.value})} required /></div>
            </div>
            <div className="space-y-2"><Label>Data Pagamento</Label><Input type="date" value={recForm.dataPagamento} onChange={e => setRecForm({...recForm, dataPagamento: e.target.value})} /></div>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setRecDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={createRecMutation.isPending}>{createRecMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Cadastrar"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={pagDialogOpen} onOpenChange={setPagDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Novo Pagamento</DialogTitle><DialogDescription>Registre um novo pagamento</DialogDescription></DialogHeader>
          <form onSubmit={handlePagSubmit} className="space-y-4">
            <div className="space-y-2"><Label>Descricao *</Label><Input value={pagForm.descricao} onChange={e => setPagForm({...pagForm, descricao: e.target.value})} required data-testid="input-pag-descricao" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Valor *</Label><Input type="number" step="0.01" min={0} value={pagForm.valor} onChange={e => setPagForm({...pagForm, valor: e.target.value})} required data-testid="input-pag-valor" /></div>
              <div className="space-y-2"><Label>Categoria</Label><Input value={pagForm.categoria} onChange={e => setPagForm({...pagForm, categoria: e.target.value})} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={pagForm.status} onValueChange={v => setPagForm({...pagForm, status: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="PENDENTE">Pendente</SelectItem><SelectItem value="PAGO">Pago</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Data Competencia *</Label><Input type="date" value={pagForm.dataCompetencia} onChange={e => setPagForm({...pagForm, dataCompetencia: e.target.value})} required /></div>
            </div>
            <div className="space-y-2"><Label>Data Pagamento</Label><Input type="date" value={pagForm.dataPagamento} onChange={e => setPagForm({...pagForm, dataPagamento: e.target.value})} /></div>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setPagDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={createPagMutation.isPending}>{createPagMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Cadastrar"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
