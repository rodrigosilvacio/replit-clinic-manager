import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, date, numeric, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const roleEnum = pgEnum("role", ["ADMIN", "RECEPCAO", "PROFISSIONAL_SAUDE", "FINANCEIRO"]);
export const consultaStatusEnum = pgEnum("consulta_status", ["AGENDADA", "CONFIRMADA", "EM_ATENDIMENTO", "CONCLUIDA", "CANCELADA", "FALTOU"]);
export const prontuarioTipoEnum = pgEnum("prontuario_tipo", ["ANAMNESE", "EVOLUCAO", "PRESCRICAO", "ATESTADO", "EXAME", "OUTRO"]);
export const movimentacaoTipoEnum = pgEnum("movimentacao_tipo", ["ENTRADA", "SAIDA", "AJUSTE"]);
export const formaPagamentoEnum = pgEnum("forma_pagamento", ["PIX", "CARTAO", "DINHEIRO", "BOLETO", "TRANSFERENCIA"]);
export const statusFinanceiroEnum = pgEnum("status_financeiro", ["PENDENTE", "PAGO", "ESTORNADO"]);
export const statusPagamentoEnum = pgEnum("status_pagamento", ["PENDENTE", "PAGO"]);
export const sexoEnum = pgEnum("sexo", ["M", "F", "OUTRO"]);

export const colaboradores = pgTable("colaboradores", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  nome: text("nome").notNull(),
  email: text("email").notNull().unique(),
  senha: text("senha").notNull(),
  telefone: text("telefone"),
  papel: roleEnum("papel").notNull().default("RECEPCAO"),
  especialidade: text("especialidade"),
  registroProfissional: text("registro_profissional"),
  ativo: boolean("ativo").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const pacientes = pgTable("pacientes", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  nome: text("nome").notNull(),
  cpf: text("cpf"),
  dataNascimento: date("data_nascimento"),
  sexo: sexoEnum("sexo"),
  telefone: text("telefone").notNull(),
  email: text("email"),
  endereco: text("endereco"),
  convenio: text("convenio"),
  numeroConvenio: text("numero_convenio"),
  contatoEmergencia: text("contato_emergencia"),
  alergiasAlertas: text("alergias_alertas"),
  consentimentoLgpd: boolean("consentimento_lgpd").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const servicos = pgTable("servicos", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  nome: text("nome").notNull(),
  duracaoMin: integer("duracao_min").notNull().default(30),
  preco: numeric("preco", { precision: 10, scale: 2 }).notNull(),
  descricao: text("descricao"),
  ativo: boolean("ativo").notNull().default(true),
});

export const salas = pgTable("salas", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  nome: text("nome").notNull(),
  descricao: text("descricao"),
  ativa: boolean("ativa").notNull().default(true),
});

export const consultas = pgTable("consultas", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  pacienteId: integer("paciente_id").notNull().references(() => pacientes.id),
  colaboradorId: integer("colaborador_id").notNull().references(() => colaboradores.id),
  salaId: integer("sala_id").references(() => salas.id),
  servicoId: integer("servico_id").notNull().references(() => servicos.id),
  inicio: timestamp("inicio").notNull(),
  fim: timestamp("fim").notNull(),
  status: consultaStatusEnum("status").notNull().default("AGENDADA"),
  observacoes: text("observacoes"),
  encaixe: boolean("encaixe").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const registrosProntuario = pgTable("registros_prontuario", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  consultaId: integer("consulta_id").notNull().references(() => consultas.id),
  tipo: prontuarioTipoEnum("tipo").notNull(),
  texto: text("texto").notNull(),
  criadoPor: integer("criado_por").notNull().references(() => colaboradores.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const itensEstoque = pgTable("itens_estoque", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  nome: text("nome").notNull(),
  sku: text("sku"),
  unidade: text("unidade").notNull().default("UN"),
  estoqueMinimo: integer("estoque_minimo").notNull().default(5),
  quantidadeAtual: integer("quantidade_atual").notNull().default(0),
  ativo: boolean("ativo").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const movimentacoesEstoque = pgTable("movimentacoes_estoque", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  itemId: integer("item_id").notNull().references(() => itensEstoque.id),
  tipo: movimentacaoTipoEnum("tipo").notNull(),
  quantidade: integer("quantidade").notNull(),
  motivo: text("motivo"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const recebimentos = pgTable("recebimentos", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  consultaId: integer("consulta_id").references(() => consultas.id),
  pacienteId: integer("paciente_id").references(() => pacientes.id),
  descricao: text("descricao").notNull(),
  valor: numeric("valor", { precision: 10, scale: 2 }).notNull(),
  formaPagamento: formaPagamentoEnum("forma_pagamento").notNull().default("DINHEIRO"),
  status: statusFinanceiroEnum("status").notNull().default("PENDENTE"),
  dataCompetencia: date("data_competencia").notNull(),
  dataPagamento: date("data_pagamento"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const pagamentos = pgTable("pagamentos", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  descricao: text("descricao").notNull(),
  valor: numeric("valor", { precision: 10, scale: 2 }).notNull(),
  categoria: text("categoria"),
  status: statusPagamentoEnum("status").notNull().default("PENDENTE"),
  dataCompetencia: date("data_competencia").notNull(),
  dataPagamento: date("data_pagamento"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertColaboradorSchema = createInsertSchema(colaboradores).omit({ id: true, createdAt: true });
export const insertPacienteSchema = createInsertSchema(pacientes).omit({ id: true, createdAt: true, updatedAt: true });
export const insertServicoSchema = createInsertSchema(servicos).omit({ id: true });
export const insertSalaSchema = createInsertSchema(salas).omit({ id: true });
export const insertConsultaSchema = createInsertSchema(consultas).omit({ id: true, createdAt: true });
export const insertRegistroProntuarioSchema = createInsertSchema(registrosProntuario).omit({ id: true, createdAt: true, updatedAt: true });
export const insertItemEstoqueSchema = createInsertSchema(itensEstoque).omit({ id: true, createdAt: true });
export const insertMovimentacaoEstoqueSchema = createInsertSchema(movimentacoesEstoque).omit({ id: true, createdAt: true });
export const insertRecebimentoSchema = createInsertSchema(recebimentos).omit({ id: true, createdAt: true });
export const insertPagamentoSchema = createInsertSchema(pagamentos).omit({ id: true, createdAt: true });

export const loginSchema = z.object({
  email: z.string().email(),
  senha: z.string().min(4),
});

export type InsertColaborador = z.infer<typeof insertColaboradorSchema>;
export type Colaborador = typeof colaboradores.$inferSelect;
export type InsertPaciente = z.infer<typeof insertPacienteSchema>;
export type Paciente = typeof pacientes.$inferSelect;
export type InsertServico = z.infer<typeof insertServicoSchema>;
export type Servico = typeof servicos.$inferSelect;
export type InsertSala = z.infer<typeof insertSalaSchema>;
export type Sala = typeof salas.$inferSelect;
export type InsertConsulta = z.infer<typeof insertConsultaSchema>;
export type Consulta = typeof consultas.$inferSelect;
export type InsertRegistroProntuario = z.infer<typeof insertRegistroProntuarioSchema>;
export type RegistroProntuario = typeof registrosProntuario.$inferSelect;
export type InsertItemEstoque = z.infer<typeof insertItemEstoqueSchema>;
export type ItemEstoque = typeof itensEstoque.$inferSelect;
export type InsertMovimentacaoEstoque = z.infer<typeof insertMovimentacaoEstoqueSchema>;
export type MovimentacaoEstoque = typeof movimentacoesEstoque.$inferSelect;
export type InsertRecebimento = z.infer<typeof insertRecebimentoSchema>;
export type Recebimento = typeof recebimentos.$inferSelect;
export type InsertPagamento = z.infer<typeof insertPagamentoSchema>;
export type Pagamento = typeof pagamentos.$inferSelect;
