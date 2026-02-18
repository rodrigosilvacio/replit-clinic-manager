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
import { Plus, Search, UserCog, Loader2 } from "lucide-react";
import type { Colaborador } from "@shared/schema";

const roleLabels: Record<string, string> = {
  ADMIN: "Administrador",
  RECEPCAO: "Recepcao",
  PROFISSIONAL_SAUDE: "Profissional de Saude",
  FINANCEIRO: "Financeiro",
};

export default function ColaboradoresPage() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({
    nome: "", email: "", senha: "", telefone: "", papel: "RECEPCAO" as string,
    especialidade: "", registroProfissional: "", ativo: true,
  });

  const { data: colaboradores, isLoading } = useQuery<Colaborador[]>({
    queryKey: ["/api/colaboradores"],
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/colaboradores", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/colaboradores"] });
      setDialogOpen(false);
      resetForm();
      toast({ title: "Colaborador cadastrado com sucesso" });
    },
    onError: (err: any) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => apiRequest("PATCH", `/api/colaboradores/${editId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/colaboradores"] });
      setDialogOpen(false);
      resetForm();
      toast({ title: "Colaborador atualizado com sucesso" });
    },
    onError: (err: any) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });

  const resetForm = () => {
    setEditId(null);
    setForm({ nome: "", email: "", senha: "", telefone: "", papel: "RECEPCAO", especialidade: "", registroProfissional: "", ativo: true });
  };

  const openEdit = (c: Colaborador) => {
    setEditId(c.id);
    setForm({
      nome: c.nome, email: c.email, senha: "", telefone: c.telefone || "",
      papel: c.papel, especialidade: c.especialidade || "",
      registroProfissional: c.registroProfissional || "", ativo: c.ativo,
    });
    setDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: any = {
      ...form,
      telefone: form.telefone || null,
      especialidade: form.especialidade || null,
      registroProfissional: form.registroProfissional || null,
    };
    if (editId && !form.senha) delete payload.senha;
    if (editId) updateMutation.mutate(payload);
    else createMutation.mutate(payload);
  };

  const filtered = colaboradores?.filter((c) =>
    c.nome.toLowerCase().includes(search.toLowerCase()) || c.email.includes(search)
  ) || [];

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight" data-testid="text-colaboradores-title">Colaboradores</h1>
          <p className="text-sm text-muted-foreground mt-1">{filtered.length} colaborador(es)</p>
        </div>
        <Button onClick={() => { resetForm(); setDialogOpen(true); }} data-testid="button-add-colaborador">
          <Plus className="w-4 h-4 mr-2" /> Novo Colaborador
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Buscar por nome ou email..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" data-testid="input-search-colaborador" />
      </div>

      {isLoading ? (
        <Card><CardContent className="p-6"><div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div></CardContent></Card>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="p-12 text-center"><UserCog className="w-12 h-12 mx-auto mb-3 text-muted-foreground/40" /><p className="text-muted-foreground">Nenhum colaborador encontrado</p></CardContent></Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead className="hidden md:table-cell">Email</TableHead>
                  <TableHead>Papel</TableHead>
                  <TableHead className="hidden lg:table-cell">Especialidade</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Acoes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((c) => (
                  <TableRow key={c.id} data-testid={`row-colaborador-${c.id}`}>
                    <TableCell className="font-medium">{c.nome}</TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground text-sm">{c.email}</TableCell>
                    <TableCell><Badge variant="secondary">{roleLabels[c.papel]}</Badge></TableCell>
                    <TableCell className="hidden lg:table-cell text-muted-foreground text-sm">{c.especialidade || "-"}</TableCell>
                    <TableCell>
                      <Badge variant={c.ativo ? "default" : "secondary"} className={c.ativo ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" : ""}>
                        {c.ativo ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(c)} data-testid={`button-edit-colaborador-${c.id}`}>Editar</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? "Editar Colaborador" : "Novo Colaborador"}</DialogTitle>
            <DialogDescription>Preencha os dados do colaborador</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} required data-testid="input-colaborador-nome" />
            </div>
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required data-testid="input-colaborador-email" />
            </div>
            <div className="space-y-2">
              <Label>{editId ? "Nova Senha (deixe vazio para manter)" : "Senha *"}</Label>
              <Input type="password" value={form.senha} onChange={e => setForm({...form, senha: e.target.value})} required={!editId} data-testid="input-colaborador-senha" />
            </div>
            <div className="space-y-2">
              <Label>Telefone</Label>
              <Input value={form.telefone} onChange={e => setForm({...form, telefone: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Papel *</Label>
              <Select value={form.papel} onValueChange={v => setForm({...form, papel: v})}>
                <SelectTrigger data-testid="select-colaborador-papel"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">Administrador</SelectItem>
                  <SelectItem value="RECEPCAO">Recepcao</SelectItem>
                  <SelectItem value="PROFISSIONAL_SAUDE">Profissional de Saude</SelectItem>
                  <SelectItem value="FINANCEIRO">Financeiro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Especialidade</Label>
              <Input value={form.especialidade} onChange={e => setForm({...form, especialidade: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Registro Profissional</Label>
              <Input value={form.registroProfissional} onChange={e => setForm({...form, registroProfissional: e.target.value})} />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={isPending} data-testid="button-save-colaborador">
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : editId ? "Salvar" : "Cadastrar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
