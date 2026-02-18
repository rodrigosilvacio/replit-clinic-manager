import { eq, desc, and, gte, lte, sql, ilike } from "drizzle-orm";
import { db } from "./db";
import {
  colaboradores, pacientes, servicos, salas, consultas,
  registrosProntuario, itensEstoque, movimentacoesEstoque,
  recebimentos, pagamentos,
  type InsertColaborador, type Colaborador,
  type InsertPaciente, type Paciente,
  type InsertServico, type Servico,
  type InsertSala, type Sala,
  type InsertConsulta, type Consulta,
  type InsertRegistroProntuario, type RegistroProntuario,
  type InsertItemEstoque, type ItemEstoque,
  type InsertMovimentacaoEstoque, type MovimentacaoEstoque,
  type InsertRecebimento, type Recebimento,
  type InsertPagamento, type Pagamento,
} from "@shared/schema";

export interface IStorage {
  getColaboradorByEmail(email: string): Promise<Colaborador | undefined>;
  getColaborador(id: number): Promise<Colaborador | undefined>;
  getColaboradores(): Promise<Colaborador[]>;
  createColaborador(data: InsertColaborador): Promise<Colaborador>;
  updateColaborador(id: number, data: Partial<InsertColaborador>): Promise<Colaborador | undefined>;

  getPacientes(): Promise<Paciente[]>;
  getPaciente(id: number): Promise<Paciente | undefined>;
  createPaciente(data: InsertPaciente): Promise<Paciente>;
  updatePaciente(id: number, data: Partial<InsertPaciente>): Promise<Paciente | undefined>;

  getServicos(): Promise<Servico[]>;
  getServico(id: number): Promise<Servico | undefined>;
  createServico(data: InsertServico): Promise<Servico>;
  updateServico(id: number, data: Partial<InsertServico>): Promise<Servico | undefined>;

  getSalas(): Promise<Sala[]>;
  createSala(data: InsertSala): Promise<Sala>;

  getConsultas(): Promise<any[]>;
  getConsulta(id: number): Promise<Consulta | undefined>;
  createConsulta(data: InsertConsulta): Promise<Consulta>;
  updateConsultaStatus(id: number, status: string): Promise<Consulta | undefined>;

  getProntuarios(): Promise<any[]>;
  createProntuario(data: InsertRegistroProntuario): Promise<RegistroProntuario>;

  getItensEstoque(): Promise<ItemEstoque[]>;
  createItemEstoque(data: InsertItemEstoque): Promise<ItemEstoque>;
  updateItemEstoque(id: number, data: Partial<InsertItemEstoque>): Promise<ItemEstoque | undefined>;
  getMovimentacoesEstoque(): Promise<any[]>;
  createMovimentacaoEstoque(data: InsertMovimentacaoEstoque): Promise<MovimentacaoEstoque>;

  getRecebimentos(): Promise<Recebimento[]>;
  getRecebimentoByConsultaId(consultaId: number): Promise<Recebimento | undefined>;
  createRecebimento(data: InsertRecebimento): Promise<Recebimento>;
  getPagamentos(): Promise<Pagamento[]>;
  createPagamento(data: InsertPagamento): Promise<Pagamento>;

  getDashboardData(): Promise<any>;
}

export class DatabaseStorage implements IStorage {
  async getColaboradorByEmail(email: string): Promise<Colaborador | undefined> {
    const [result] = await db.select().from(colaboradores).where(eq(colaboradores.email, email)).limit(1);
    return result;
  }

  async getColaborador(id: number): Promise<Colaborador | undefined> {
    const [result] = await db.select().from(colaboradores).where(eq(colaboradores.id, id)).limit(1);
    return result;
  }

  async getColaboradores(): Promise<Colaborador[]> {
    return db.select().from(colaboradores).orderBy(colaboradores.nome);
  }

  async createColaborador(data: InsertColaborador): Promise<Colaborador> {
    const [result] = await db.insert(colaboradores).values(data).returning();
    return result;
  }

  async updateColaborador(id: number, data: Partial<InsertColaborador>): Promise<Colaborador | undefined> {
    const [result] = await db.update(colaboradores).set(data).where(eq(colaboradores.id, id)).returning();
    return result;
  }

  async getPacientes(): Promise<Paciente[]> {
    return db.select().from(pacientes).orderBy(pacientes.nome);
  }

  async getPaciente(id: number): Promise<Paciente | undefined> {
    const [result] = await db.select().from(pacientes).where(eq(pacientes.id, id)).limit(1);
    return result;
  }

  async createPaciente(data: InsertPaciente): Promise<Paciente> {
    const [result] = await db.insert(pacientes).values(data).returning();
    return result;
  }

  async updatePaciente(id: number, data: Partial<InsertPaciente>): Promise<Paciente | undefined> {
    const [result] = await db.update(pacientes).set({ ...data, updatedAt: new Date() }).where(eq(pacientes.id, id)).returning();
    return result;
  }

  async getServicos(): Promise<Servico[]> {
    return db.select().from(servicos).orderBy(servicos.nome);
  }

  async getServico(id: number): Promise<Servico | undefined> {
    const [result] = await db.select().from(servicos).where(eq(servicos.id, id)).limit(1);
    return result;
  }

  async createServico(data: InsertServico): Promise<Servico> {
    const [result] = await db.insert(servicos).values(data).returning();
    return result;
  }

  async updateServico(id: number, data: Partial<InsertServico>): Promise<Servico | undefined> {
    const [result] = await db.update(servicos).set(data).where(eq(servicos.id, id)).returning();
    return result;
  }

  async getSalas(): Promise<Sala[]> {
    return db.select().from(salas).orderBy(salas.nome);
  }

  async createSala(data: InsertSala): Promise<Sala> {
    const [result] = await db.insert(salas).values(data).returning();
    return result;
  }

  async getConsultas(): Promise<any[]> {
    const results = await db
      .select({
        id: consultas.id,
        pacienteId: consultas.pacienteId,
        colaboradorId: consultas.colaboradorId,
        salaId: consultas.salaId,
        servicoId: consultas.servicoId,
        inicio: consultas.inicio,
        fim: consultas.fim,
        status: consultas.status,
        observacoes: consultas.observacoes,
        encaixe: consultas.encaixe,
        createdAt: consultas.createdAt,
        pacienteNome: pacientes.nome,
        colaboradorNome: colaboradores.nome,
        servicoNome: servicos.nome,
      })
      .from(consultas)
      .leftJoin(pacientes, eq(consultas.pacienteId, pacientes.id))
      .leftJoin(colaboradores, eq(consultas.colaboradorId, colaboradores.id))
      .leftJoin(servicos, eq(consultas.servicoId, servicos.id))
      .orderBy(desc(consultas.inicio));
    return results;
  }

  async getConsulta(id: number): Promise<Consulta | undefined> {
    const [result] = await db.select().from(consultas).where(eq(consultas.id, id)).limit(1);
    return result;
  }

  async createConsulta(data: InsertConsulta): Promise<Consulta> {
    const [result] = await db.insert(consultas).values(data).returning();
    return result;
  }

  async updateConsultaStatus(id: number, status: string): Promise<Consulta | undefined> {
    const [result] = await db.update(consultas).set({ status: status as any }).where(eq(consultas.id, id)).returning();
    return result;
  }

  async getProntuarios(): Promise<any[]> {
    const results = await db
      .select({
        id: registrosProntuario.id,
        consultaId: registrosProntuario.consultaId,
        tipo: registrosProntuario.tipo,
        texto: registrosProntuario.texto,
        criadoPor: registrosProntuario.criadoPor,
        createdAt: registrosProntuario.createdAt,
        updatedAt: registrosProntuario.updatedAt,
        colaboradorNome: colaboradores.nome,
        pacienteNome: pacientes.nome,
      })
      .from(registrosProntuario)
      .leftJoin(colaboradores, eq(registrosProntuario.criadoPor, colaboradores.id))
      .leftJoin(consultas, eq(registrosProntuario.consultaId, consultas.id))
      .leftJoin(pacientes, eq(consultas.pacienteId, pacientes.id))
      .orderBy(desc(registrosProntuario.createdAt));
    return results;
  }

  async createProntuario(data: InsertRegistroProntuario): Promise<RegistroProntuario> {
    const [result] = await db.insert(registrosProntuario).values(data).returning();
    return result;
  }

  async getItensEstoque(): Promise<ItemEstoque[]> {
    return db.select().from(itensEstoque).orderBy(itensEstoque.nome);
  }

  async createItemEstoque(data: InsertItemEstoque): Promise<ItemEstoque> {
    const [result] = await db.insert(itensEstoque).values(data).returning();
    return result;
  }

  async updateItemEstoque(id: number, data: Partial<InsertItemEstoque>): Promise<ItemEstoque | undefined> {
    const [result] = await db.update(itensEstoque).set(data).where(eq(itensEstoque.id, id)).returning();
    return result;
  }

  async getMovimentacoesEstoque(): Promise<any[]> {
    const results = await db
      .select({
        id: movimentacoesEstoque.id,
        itemId: movimentacoesEstoque.itemId,
        tipo: movimentacoesEstoque.tipo,
        quantidade: movimentacoesEstoque.quantidade,
        motivo: movimentacoesEstoque.motivo,
        createdAt: movimentacoesEstoque.createdAt,
        itemNome: itensEstoque.nome,
      })
      .from(movimentacoesEstoque)
      .leftJoin(itensEstoque, eq(movimentacoesEstoque.itemId, itensEstoque.id))
      .orderBy(desc(movimentacoesEstoque.createdAt));
    return results;
  }

  async createMovimentacaoEstoque(data: InsertMovimentacaoEstoque): Promise<MovimentacaoEstoque> {
    const [result] = await db.insert(movimentacoesEstoque).values(data).returning();
    const item = await this.getItemEstoque(data.itemId);
    if (item) {
      let newQtd = item.quantidadeAtual;
      if (data.tipo === "ENTRADA") newQtd += data.quantidade;
      else if (data.tipo === "SAIDA") newQtd -= data.quantidade;
      else newQtd = data.quantidade;
      await db.update(itensEstoque).set({ quantidadeAtual: Math.max(0, newQtd) }).where(eq(itensEstoque.id, data.itemId));
    }
    return result;
  }

  private async getItemEstoque(id: number): Promise<ItemEstoque | undefined> {
    const [result] = await db.select().from(itensEstoque).where(eq(itensEstoque.id, id)).limit(1);
    return result;
  }

  async getRecebimentos(): Promise<Recebimento[]> {
    return db.select().from(recebimentos).orderBy(desc(recebimentos.createdAt));
  }

  async getRecebimentoByConsultaId(consultaId: number): Promise<Recebimento | undefined> {
    const [result] = await db.select().from(recebimentos).where(eq(recebimentos.consultaId, consultaId)).limit(1);
    return result;
  }

  async createRecebimento(data: InsertRecebimento): Promise<Recebimento> {
    const [result] = await db.insert(recebimentos).values(data).returning();
    return result;
  }

  async getPagamentos(): Promise<Pagamento[]> {
    return db.select().from(pagamentos).orderBy(desc(pagamentos.createdAt));
  }

  async createPagamento(data: InsertPagamento): Promise<Pagamento> {
    const [result] = await db.insert(pagamentos).values(data).returning();
    return result;
  }

  async getDashboardData(): Promise<any> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [{ count: totalPacientes }] = await db.select({ count: sql<number>`count(*)` }).from(pacientes);

    const [{ count: consultasHoje }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(consultas)
      .where(and(gte(consultas.inicio, today), lte(consultas.inicio, tomorrow)));

    const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const [{ total: receitaMes }] = await db
      .select({ total: sql<number>`COALESCE(SUM(CAST(valor AS DECIMAL)), 0)` })
      .from(recebimentos)
      .where(and(eq(recebimentos.status, "PAGO"), gte(recebimentos.dataCompetencia, firstOfMonth.toISOString().split("T")[0])));

    const [{ count: estoqueCritico }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(itensEstoque)
      .where(sql`${itensEstoque.quantidadeAtual} <= ${itensEstoque.estoqueMinimo}`);

    const proximasConsultas = await db
      .select({
        id: consultas.id,
        inicio: consultas.inicio,
        status: consultas.status,
        pacienteNome: pacientes.nome,
        colaboradorNome: colaboradores.nome,
        servicoNome: servicos.nome,
      })
      .from(consultas)
      .leftJoin(pacientes, eq(consultas.pacienteId, pacientes.id))
      .leftJoin(colaboradores, eq(consultas.colaboradorId, colaboradores.id))
      .leftJoin(servicos, eq(consultas.servicoId, servicos.id))
      .where(and(gte(consultas.inicio, today), lte(consultas.inicio, tomorrow)))
      .orderBy(consultas.inicio)
      .limit(5);

    const consultasRecentes = await db
      .select({
        id: consultas.id,
        inicio: consultas.inicio,
        status: consultas.status,
        pacienteNome: pacientes.nome,
        servicoNome: servicos.nome,
      })
      .from(consultas)
      .leftJoin(pacientes, eq(consultas.pacienteId, pacientes.id))
      .leftJoin(servicos, eq(consultas.servicoId, servicos.id))
      .orderBy(desc(consultas.createdAt))
      .limit(5);

    return {
      totalPacientes: Number(totalPacientes),
      consultasHoje: Number(consultasHoje),
      receitaMes: Number(receitaMes),
      estoqueCritico: Number(estoqueCritico),
      proximasConsultas,
      consultasRecentes,
    };
  }
}

export const storage = new DatabaseStorage();
