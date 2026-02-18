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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, User, Phone, Mail, Loader2 } from "lucide-react";
import type { Paciente } from "@shared/schema";

export default function PacientesPage() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({
    nome: "", cpf: "", dataNascimento: "", sexo: "" as string, telefone: "",
    email: "", endereco: "", convenio: "", numeroConvenio: "",
    contatoEmergencia: "", alergiasAlertas: "", consentimentoLgpd: false,
  });

  const { data: pacientes, isLoading } = useQuery<Paciente[]>({
    queryKey: ["/api/pacientes"],
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/pacientes", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pacientes"] });
      setDialogOpen(false);
      resetForm();
      toast({ title: "Paciente cadastrado com sucesso" });
    },
    onError: (err: any) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => apiRequest("PATCH", `/api/pacientes/${editId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pacientes"] });
      setDialogOpen(false);
      resetForm();
      toast({ title: "Paciente atualizado com sucesso" });
    },
    onError: (err: any) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });

  const resetForm = () => {
    setEditId(null);
    setForm({ nome: "", cpf: "", dataNascimento: "", sexo: "", telefone: "", email: "", endereco: "", convenio: "", numeroConvenio: "", contatoEmergencia: "", alergiasAlertas: "", consentimentoLgpd: false });
  };

  const openEdit = (p: Paciente) => {
    setEditId(p.id);
    setForm({
      nome: p.nome, cpf: p.cpf || "", dataNascimento: p.dataNascimento || "",
      sexo: p.sexo || "", telefone: p.telefone, email: p.email || "",
      endereco: p.endereco || "", convenio: p.convenio || "",
      numeroConvenio: p.numeroConvenio || "", contatoEmergencia: p.contatoEmergencia || "",
      alergiasAlertas: p.alergiasAlertas || "", consentimentoLgpd: p.consentimentoLgpd,
    });
    setDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...form,
      sexo: form.sexo || null,
      dataNascimento: form.dataNascimento || null,
      cpf: form.cpf || null,
      email: form.email || null,
      endereco: form.endereco || null,
      convenio: form.convenio || null,
      numeroConvenio: form.numeroConvenio || null,
      contatoEmergencia: form.contatoEmergencia || null,
      alergiasAlertas: form.alergiasAlertas || null,
    };
    if (editId) updateMutation.mutate(payload);
    else createMutation.mutate(payload);
  };

  const filtered = pacientes?.filter((p) =>
    p.nome.toLowerCase().includes(search.toLowerCase()) ||
    (p.cpf && p.cpf.includes(search)) ||
    p.telefone.includes(search)
  ) || [];

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight" data-testid="text-pacientes-title">Pacientes</h1>
          <p className="text-sm text-muted-foreground mt-1">{filtered.length} paciente(s) cadastrado(s)</p>
        </div>
        <Button onClick={() => { resetForm(); setDialogOpen(true); }} data-testid="button-add-paciente">
          <Plus className="w-4 h-4 mr-2" /> Novo Paciente
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome, CPF ou telefone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
          data-testid="input-search-paciente"
        />
      </div>

      {isLoading ? (
        <Card><CardContent className="p-6"><div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div></CardContent></Card>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <User className="w-12 h-12 mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-muted-foreground">Nenhum paciente encontrado</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead className="hidden md:table-cell">Telefone</TableHead>
                  <TableHead className="hidden md:table-cell">Email</TableHead>
                  <TableHead className="hidden lg:table-cell">Convenio</TableHead>
                  <TableHead className="text-right">Acoes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((p) => (
                  <TableRow key={p.id} data-testid={`row-paciente-${p.id}`}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-md bg-primary/10">
                          <User className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{p.nome}</p>
                          {p.cpf && <p className="text-xs text-muted-foreground">{p.cpf}</p>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Phone className="w-3 h-3" /> {p.telefone}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {p.email && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Mail className="w-3 h-3" /> {p.email}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {p.convenio && <Badge variant="secondary">{p.convenio}</Badge>}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(p)} data-testid={`button-edit-paciente-${p.id}`}>
                        Editar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? "Editar Paciente" : "Novo Paciente"}</DialogTitle>
            <DialogDescription>Preencha os dados do paciente</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome *</Label>
                <Input value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} required data-testid="input-paciente-nome" />
              </div>
              <div className="space-y-2">
                <Label>CPF</Label>
                <Input value={form.cpf} onChange={e => setForm({...form, cpf: e.target.value})} data-testid="input-paciente-cpf" />
              </div>
              <div className="space-y-2">
                <Label>Data Nascimento</Label>
                <Input type="date" value={form.dataNascimento} onChange={e => setForm({...form, dataNascimento: e.target.value})} data-testid="input-paciente-nascimento" />
              </div>
              <div className="space-y-2">
                <Label>Sexo</Label>
                <Select value={form.sexo} onValueChange={v => setForm({...form, sexo: v})}>
                  <SelectTrigger data-testid="select-paciente-sexo"><SelectValue placeholder="Selecionar" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="M">Masculino</SelectItem>
                    <SelectItem value="F">Feminino</SelectItem>
                    <SelectItem value="OUTRO">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Telefone *</Label>
                <Input value={form.telefone} onChange={e => setForm({...form, telefone: e.target.value})} required data-testid="input-paciente-telefone" />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} data-testid="input-paciente-email" />
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label>Endereco</Label>
                <Input value={form.endereco} onChange={e => setForm({...form, endereco: e.target.value})} data-testid="input-paciente-endereco" />
              </div>
              <div className="space-y-2">
                <Label>Convenio</Label>
                <Input value={form.convenio} onChange={e => setForm({...form, convenio: e.target.value})} data-testid="input-paciente-convenio" />
              </div>
              <div className="space-y-2">
                <Label>Numero Convenio</Label>
                <Input value={form.numeroConvenio} onChange={e => setForm({...form, numeroConvenio: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Contato Emergencia</Label>
                <Input value={form.contatoEmergencia} onChange={e => setForm({...form, contatoEmergencia: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Alergias / Alertas</Label>
                <Textarea value={form.alergiasAlertas} onChange={e => setForm({...form, alergiasAlertas: e.target.value})} className="resize-none" />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={isPending} data-testid="button-save-paciente">
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : editId ? "Salvar" : "Cadastrar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
