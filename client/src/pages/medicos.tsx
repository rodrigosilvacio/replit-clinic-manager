import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Stethoscope, Loader2, Phone, Mail } from "lucide-react";
import { useAuth } from "@/lib/auth";
import type { Colaborador } from "@shared/schema";

export default function MedicosPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const isAdmin = user?.papel === "ADMIN";
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({
    nome: "",
    email: "",
    senha: "",
    telefone: "",
    especialidade: "",
    registroProfissional: "",
    ativo: true,
  });

  const { data: colaboradores, isLoading } = useQuery<Colaborador[]>({
    queryKey: ["/api/colaboradores"],
  });

  const medicos = colaboradores?.filter((c) => c.papel === "PROFISSIONAL_SAUDE") || [];

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/colaboradores", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/colaboradores"] });
      setDialogOpen(false);
      resetForm();
      toast({ title: "Profissional cadastrado com sucesso" });
    },
    onError: (err: any) =>
      toast({ title: "Erro ao cadastrar", description: err.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => apiRequest("PATCH", `/api/colaboradores/${editId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/colaboradores"] });
      setDialogOpen(false);
      resetForm();
      toast({ title: "Profissional atualizado com sucesso" });
    },
    onError: (err: any) =>
      toast({ title: "Erro ao atualizar", description: err.message, variant: "destructive" }),
  });

  const resetForm = () => {
    setEditId(null);
    setForm({
      nome: "",
      email: "",
      senha: "",
      telefone: "",
      especialidade: "",
      registroProfissional: "",
      ativo: true,
    });
  };

  const openEdit = (c: Colaborador) => {
    setEditId(c.id);
    setForm({
      nome: c.nome,
      email: c.email,
      senha: "",
      telefone: c.telefone || "",
      especialidade: c.especialidade || "",
      registroProfissional: c.registroProfissional || "",
      ativo: c.ativo,
    });
    setDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: any = {
      ...form,
      papel: "PROFISSIONAL_SAUDE",
      telefone: form.telefone || null,
      especialidade: form.especialidade || null,
      registroProfissional: form.registroProfissional || null,
    };
    if (editId && !form.senha) delete payload.senha;
    if (editId) updateMutation.mutate(payload);
    else createMutation.mutate(payload);
  };

  const filtered =
    medicos.filter(
      (c) =>
        c.nome.toLowerCase().includes(search.toLowerCase()) ||
        c.email.toLowerCase().includes(search.toLowerCase()) ||
        (c.especialidade && c.especialidade.toLowerCase().includes(search.toLowerCase()))
    ) || [];

  const ativos = medicos.filter((m) => m.ativo).length;
  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight" data-testid="text-medicos-title">
            Profissionais de Saude
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {ativos} ativo(s) de {medicos.length} profissional(is)
          </p>
        </div>
        {isAdmin && (
          <Button
            onClick={() => {
              resetForm();
              setDialogOpen(true);
            }}
            data-testid="button-add-medico"
          >
            <Plus className="w-4 h-4 mr-2" /> Novo Profissional
          </Button>
        )}
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome, email ou especialidade..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
          data-testid="input-search-medico"
        />
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Stethoscope className="w-12 h-12 mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-muted-foreground">Nenhum profissional encontrado</p>
            <p className="text-sm text-muted-foreground/60 mt-1">
              Clique em "Novo Profissional" para adicionar
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Especialidade</TableHead>
                  <TableHead className="hidden md:table-cell">Registro (CRM)</TableHead>
                  <TableHead className="hidden lg:table-cell">Contato</TableHead>
                  <TableHead>Status</TableHead>
                  {isAdmin && <TableHead className="text-right">Acoes</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((m) => (
                  <TableRow key={m.id} data-testid={`row-medico-${m.id}`}>
                    <TableCell className="font-medium">{m.nome}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {m.especialidade || "-"}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                      {m.registroProfissional || "-"}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div className="flex flex-col gap-0.5 text-sm text-muted-foreground">
                        {m.email && (
                          <span className="flex items-center gap-1.5">
                            <Mail className="w-3 h-3" />
                            {m.email}
                          </span>
                        )}
                        {m.telefone && (
                          <span className="flex items-center gap-1.5">
                            <Phone className="w-3 h-3" />
                            {m.telefone}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={m.ativo ? "default" : "secondary"}
                        className={
                          m.ativo
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                            : ""
                        }
                      >
                        {m.ativo ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    {isAdmin && (
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEdit(m)}
                          data-testid={`button-edit-medico-${m.id}`}
                        >
                          Editar
                        </Button>
                      </TableCell>
                    )}
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
            <DialogTitle>
              {editId ? "Editar Profissional" : "Novo Profissional"}
            </DialogTitle>
            <DialogDescription>
              Preencha os dados do profissional de saude
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Nome completo *</Label>
              <Input
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                required
                placeholder="Dr. Joao da Silva"
                data-testid="input-medico-nome"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Especialidade</Label>
                <Input
                  value={form.especialidade}
                  onChange={(e) => setForm({ ...form, especialidade: e.target.value })}
                  placeholder="Ex: Cardiologia"
                  data-testid="input-medico-especialidade"
                />
              </div>
              <div className="space-y-2">
                <Label>Registro profissional (CRM)</Label>
                <Input
                  value={form.registroProfissional}
                  onChange={(e) => setForm({ ...form, registroProfissional: e.target.value })}
                  placeholder="Ex: CRM/SP 123456"
                  data-testid="input-medico-crm"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                placeholder="joao@clinica.com"
                data-testid="input-medico-email"
              />
            </div>
            <div className="space-y-2">
              <Label>Telefone</Label>
              <Input
                value={form.telefone}
                onChange={(e) => setForm({ ...form, telefone: e.target.value })}
                placeholder="(11) 99999-9999"
                data-testid="input-medico-telefone"
              />
            </div>
            <div className="space-y-2">
              <Label>
                {editId ? "Nova senha (deixe vazio para manter a atual)" : "Senha de acesso *"}
              </Label>
              <Input
                type="password"
                value={form.senha}
                onChange={(e) => setForm({ ...form, senha: e.target.value })}
                required={!editId}
                placeholder={editId ? "Deixe vazio para manter" : "Minimo 4 caracteres"}
                data-testid="input-medico-senha"
              />
            </div>
            {editId && (
              <div className="flex items-center justify-between gap-4 rounded-md border p-3">
                <div>
                  <Label className="text-sm font-medium">Status do profissional</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Profissionais inativos nao aparecem na agenda
                  </p>
                </div>
                <Switch
                  checked={form.ativo}
                  onCheckedChange={(checked) => setForm({ ...form, ativo: checked })}
                  data-testid="switch-medico-ativo"
                />
              </div>
            )}
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} data-testid="button-cancel-medico">
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending} data-testid="button-save-medico">
                {isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : editId ? (
                  "Salvar"
                ) : (
                  "Cadastrar"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
