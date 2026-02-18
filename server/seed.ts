import bcrypt from "bcryptjs";
import { db } from "./db";
import { colaboradores, pacientes, servicos, consultas, itensEstoque, recebimentos, pagamentos } from "@shared/schema";
import { eq, sql } from "drizzle-orm";

export async function seed() {
  const [existing] = await db.select({ count: sql<number>`count(*)` }).from(colaboradores);
  if (Number(existing.count) > 0) return;

  console.log("Seeding database...");

  const hashedAdmin = await bcrypt.hash("admin123", 10);
  const hashedUser = await bcrypt.hash("user123", 10);

  const [admin] = await db.insert(colaboradores).values({
    nome: "Admin Nina",
    email: "admin@nina.com",
    senha: hashedAdmin,
    telefone: "(11) 99999-0001",
    papel: "ADMIN",
    ativo: true,
  }).returning();

  const [recepcao] = await db.insert(colaboradores).values({
    nome: "Maria Souza",
    email: "maria@nina.com",
    senha: hashedUser,
    telefone: "(11) 99999-0002",
    papel: "RECEPCAO",
    ativo: true,
  }).returning();

  const [profissional] = await db.insert(colaboradores).values({
    nome: "Dr. Carlos Silva",
    email: "carlos@nina.com",
    senha: hashedUser,
    telefone: "(11) 99999-0003",
    papel: "PROFISSIONAL_SAUDE",
    especialidade: "Dermatologia",
    registroProfissional: "CRM 12345",
    ativo: true,
  }).returning();

  const [financeiro] = await db.insert(colaboradores).values({
    nome: "Ana Costa",
    email: "ana@nina.com",
    senha: hashedUser,
    telefone: "(11) 99999-0004",
    papel: "FINANCEIRO",
    ativo: true,
  }).returning();

  const pacientesData = [
    { nome: "Joao Pedro Santos", cpf: "123.456.789-00", telefone: "(11) 98765-0001", email: "joao@email.com", dataNascimento: "1985-03-15", sexo: "M" as const, consentimentoLgpd: true },
    { nome: "Ana Clara Oliveira", cpf: "234.567.890-11", telefone: "(11) 98765-0002", email: "ana.clara@email.com", dataNascimento: "1990-07-22", sexo: "F" as const, consentimentoLgpd: true },
    { nome: "Ricardo Ferreira", cpf: "345.678.901-22", telefone: "(11) 98765-0003", email: "ricardo@email.com", dataNascimento: "1978-11-08", sexo: "M" as const, convenio: "Unimed", numeroConvenio: "UN123456", consentimentoLgpd: true },
    { nome: "Patricia Lima", cpf: "456.789.012-33", telefone: "(11) 98765-0004", email: "patricia@email.com", dataNascimento: "1995-01-30", sexo: "F" as const, alergiasAlertas: "Alergia a dipirona", consentimentoLgpd: true },
    { nome: "Lucas Mendes", cpf: "567.890.123-44", telefone: "(11) 98765-0005", email: "lucas@email.com", dataNascimento: "2000-05-12", sexo: "M" as const, consentimentoLgpd: true },
  ];

  const insertedPacientes = await db.insert(pacientes).values(pacientesData).returning();

  const servicosData = [
    { nome: "Consulta Dermatologica", duracaoMin: 30, preco: "200.00", descricao: "Consulta padrao com dermatologista", ativo: true },
    { nome: "Limpeza de Pele", duracaoMin: 60, preco: "350.00", descricao: "Procedimento de limpeza facial profunda", ativo: true },
    { nome: "Peeling Quimico", duracaoMin: 45, preco: "500.00", descricao: "Tratamento com acidos para renovacao celular", ativo: true },
    { nome: "Avaliacao Estetica", duracaoMin: 20, preco: "150.00", descricao: "Avaliacao inicial para procedimentos esteticos", ativo: true },
  ];

  const insertedServicos = await db.insert(servicos).values(servicosData).returning();

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const consultasData = [];
  const hours = [8, 9, 10, 11, 14, 15, 16, 17, 9, 10];
  const statuses = ["CONCLUIDA", "CONCLUIDA", "AGENDADA", "CONFIRMADA", "AGENDADA", "EM_ATENDIMENTO", "AGENDADA", "AGENDADA", "CONCLUIDA", "CANCELADA"] as const;

  for (let i = 0; i < 10; i++) {
    const dayOffset = i < 6 ? 0 : i < 8 ? 1 : -1;
    const d = new Date(today);
    d.setDate(d.getDate() + dayOffset);
    const inicio = new Date(d);
    inicio.setHours(hours[i], 0, 0, 0);
    const servicoIdx = i % insertedServicos.length;
    const fim = new Date(inicio.getTime() + insertedServicos[servicoIdx].duracaoMin * 60000);

    consultasData.push({
      pacienteId: insertedPacientes[i % insertedPacientes.length].id,
      colaboradorId: profissional.id,
      servicoId: insertedServicos[servicoIdx].id,
      inicio,
      fim,
      status: statuses[i],
      observacoes: i === 0 ? "Retorno" : null,
      encaixe: false,
      salaId: null,
    });
  }

  await db.insert(consultas).values(consultasData);

  const estoqueData = [
    { nome: "Luvas Descartaveis", sku: "LUV001", unidade: "CX", estoqueMinimo: 10, quantidadeAtual: 25, ativo: true },
    { nome: "Acido Glicolico 10%", sku: "ACG010", unidade: "ML", estoqueMinimo: 5, quantidadeAtual: 3, ativo: true },
    { nome: "Gaze Esteril", sku: "GAZ001", unidade: "PCT", estoqueMinimo: 20, quantidadeAtual: 45, ativo: true },
    { nome: "Creme Hidratante Pos-Peeling", sku: "CHP001", unidade: "UN", estoqueMinimo: 8, quantidadeAtual: 6, ativo: true },
    { nome: "Alcool 70%", sku: "ALC070", unidade: "LT", estoqueMinimo: 5, quantidadeAtual: 12, ativo: true },
  ];

  await db.insert(itensEstoque).values(estoqueData);

  const todayStr = today.toISOString().split("T")[0];
  const recebimentosData = [
    { descricao: "Consulta - Joao Pedro Santos", valor: "200.00", formaPagamento: "PIX" as const, status: "PAGO" as const, dataCompetencia: todayStr, dataPagamento: todayStr },
    { descricao: "Limpeza de Pele - Ana Clara", valor: "350.00", formaPagamento: "CARTAO" as const, status: "PAGO" as const, dataCompetencia: todayStr, dataPagamento: todayStr },
    { descricao: "Peeling - Ricardo Ferreira", valor: "500.00", formaPagamento: "BOLETO" as const, status: "PENDENTE" as const, dataCompetencia: todayStr },
    { descricao: "Avaliacao - Patricia Lima", valor: "150.00", formaPagamento: "DINHEIRO" as const, status: "PAGO" as const, dataCompetencia: todayStr, dataPagamento: todayStr },
  ];

  await db.insert(recebimentos).values(recebimentosData);

  const pagamentosData = [
    { descricao: "Aluguel do consultorio", valor: "3500.00", categoria: "Aluguel", status: "PAGO" as const, dataCompetencia: todayStr, dataPagamento: todayStr },
    { descricao: "Fornecedor - Materiais", valor: "890.00", categoria: "Materiais", status: "PENDENTE" as const, dataCompetencia: todayStr },
    { descricao: "Conta de luz", valor: "450.00", categoria: "Utilidades", status: "PAGO" as const, dataCompetencia: todayStr, dataPagamento: todayStr },
  ];

  await db.insert(pagamentos).values(pagamentosData);

  console.log("Seed completed successfully!");
}
