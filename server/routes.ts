import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import { storage } from "./storage";
import bcrypt from "bcryptjs";
import { z } from "zod";
import {
  loginSchema,
  insertPacienteSchema,
  insertColaboradorSchema,
  insertServicoSchema,
  insertConsultaSchema,
  insertRegistroProntuarioSchema,
  insertItemEstoqueSchema,
  insertMovimentacaoEstoqueSchema,
  insertRecebimentoSchema,
  insertPagamentoSchema,
} from "@shared/schema";
import memorystore from "memorystore";

const MemoryStore = memorystore(session);

declare module "express-session" {
  interface SessionData {
    userId?: number;
    userRole?: string;
  }
}

function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Nao autorizado" });
  }
  next();
}

function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.session.userId || !req.session.userRole) {
      return res.status(401).json({ message: "Nao autorizado" });
    }
    if (!roles.includes(req.session.userRole)) {
      return res.status(403).json({ message: "Acesso negado para este perfil" });
    }
    next();
  };
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "nina-session-secret-dev",
      resave: false,
      saveUninitialized: false,
      store: new MemoryStore({ checkPeriod: 86400000 }),
      cookie: { maxAge: 24 * 60 * 60 * 1000 },
    })
  );

  // Auth
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, senha } = loginSchema.parse(req.body);
      const user = await storage.getColaboradorByEmail(email);
      if (!user || !user.ativo) return res.status(401).json({ message: "Credenciais invalidas" });
      const valid = await bcrypt.compare(senha, user.senha);
      if (!valid) return res.status(401).json({ message: "Credenciais invalidas" });
      req.session.userId = user.id;
      req.session.userRole = user.papel;
      const { senha: _, ...safeUser } = user;
      res.json({ user: safeUser });
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  app.get("/api/auth/me", async (req, res) => {
    if (!req.session.userId) return res.status(401).json({ message: "Nao autenticado" });
    const user = await storage.getColaborador(req.session.userId);
    if (!user) return res.status(401).json({ message: "Usuario nao encontrado" });
    req.session.userRole = user.papel;
    const { senha: _, ...safeUser } = user;
    res.json(safeUser);
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy(() => {});
    res.json({ ok: true });
  });

  // Dashboard
  app.get("/api/dashboard", requireAuth, async (_req, res) => {
    try {
      const data = await storage.getDashboardData();
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // Pacientes - ADMIN, RECEPCAO, PROFISSIONAL_SAUDE
  app.get("/api/pacientes", requireAuth, requireRole("ADMIN", "RECEPCAO", "PROFISSIONAL_SAUDE"), async (_req, res) => {
    const data = await storage.getPacientes();
    res.json(data);
  });

  app.post("/api/pacientes", requireAuth, requireRole("ADMIN", "RECEPCAO"), async (req, res) => {
    try {
      const validated = insertPacienteSchema.parse(req.body);
      const result = await storage.createPaciente(validated);
      res.status(201).json(result);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  app.patch("/api/pacientes/:id", requireAuth, requireRole("ADMIN", "RECEPCAO"), async (req, res) => {
    try {
      const validated = insertPacienteSchema.partial().parse(req.body);
      const result = await storage.updatePaciente(Number(req.params.id), validated);
      if (!result) return res.status(404).json({ message: "Paciente nao encontrado" });
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  // Colaboradores - ADMIN only for create/update
  app.get("/api/colaboradores", requireAuth, async (_req, res) => {
    const data = await storage.getColaboradores();
    const safe = data.map(({ senha, ...rest }) => rest);
    res.json(safe);
  });

  app.post("/api/colaboradores", requireAuth, requireRole("ADMIN"), async (req, res) => {
    try {
      const validated = insertColaboradorSchema.parse(req.body);
      const hashed = await bcrypt.hash(validated.senha, 10);
      const result = await storage.createColaborador({ ...validated, senha: hashed });
      const { senha: _, ...safe } = result;
      res.status(201).json(safe);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  app.patch("/api/colaboradores/:id", requireAuth, requireRole("ADMIN"), async (req, res) => {
    try {
      const data = insertColaboradorSchema.partial().parse(req.body);
      if (data.senha) {
        data.senha = await bcrypt.hash(data.senha, 10);
      }
      const result = await storage.updateColaborador(Number(req.params.id), data);
      if (!result) return res.status(404).json({ message: "Colaborador nao encontrado" });
      const { senha: _, ...safe } = result;
      res.json(safe);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  // Servicos - ADMIN only for create/update
  app.get("/api/servicos", requireAuth, async (_req, res) => {
    const data = await storage.getServicos();
    res.json(data);
  });

  app.post("/api/servicos", requireAuth, requireRole("ADMIN"), async (req, res) => {
    try {
      const validated = insertServicoSchema.parse(req.body);
      const result = await storage.createServico(validated);
      res.status(201).json(result);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  app.patch("/api/servicos/:id", requireAuth, requireRole("ADMIN"), async (req, res) => {
    try {
      const validated = insertServicoSchema.partial().parse(req.body);
      const result = await storage.updateServico(Number(req.params.id), validated);
      if (!result) return res.status(404).json({ message: "Servico nao encontrado" });
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  // Consultas - ADMIN, RECEPCAO, PROFISSIONAL_SAUDE
  app.get("/api/consultas", requireAuth, requireRole("ADMIN", "RECEPCAO", "PROFISSIONAL_SAUDE"), async (_req, res) => {
    const data = await storage.getConsultas();
    res.json(data);
  });

  app.post("/api/consultas", requireAuth, requireRole("ADMIN", "RECEPCAO"), async (req, res) => {
    try {
      const body = { ...req.body };
      if (typeof body.inicio === "string") body.inicio = new Date(body.inicio);
      if (typeof body.fim === "string") body.fim = new Date(body.fim);
      const validated = insertConsultaSchema.parse(body);
      const result = await storage.createConsulta(validated);
      res.status(201).json(result);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  app.patch("/api/consultas/:id/status", requireAuth, requireRole("ADMIN", "RECEPCAO", "PROFISSIONAL_SAUDE"), async (req, res) => {
    try {
      const { status } = z.object({ status: z.string() }).parse(req.body);
      const result = await storage.updateConsultaStatus(Number(req.params.id), status);
      if (!result) return res.status(404).json({ message: "Consulta nao encontrada" });
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  // Prontuarios - ADMIN, PROFISSIONAL_SAUDE
  app.get("/api/prontuarios", requireAuth, requireRole("ADMIN", "PROFISSIONAL_SAUDE"), async (_req, res) => {
    const data = await storage.getProntuarios();
    res.json(data);
  });

  app.post("/api/prontuarios", requireAuth, requireRole("ADMIN", "PROFISSIONAL_SAUDE"), async (req, res) => {
    try {
      const validated = insertRegistroProntuarioSchema.parse(req.body);
      const result = await storage.createProntuario(validated);
      res.status(201).json(result);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  // Estoque - ADMIN, RECEPCAO
  app.get("/api/estoque", requireAuth, requireRole("ADMIN", "RECEPCAO"), async (_req, res) => {
    const data = await storage.getItensEstoque();
    res.json(data);
  });

  app.post("/api/estoque", requireAuth, requireRole("ADMIN"), async (req, res) => {
    try {
      const validated = insertItemEstoqueSchema.parse(req.body);
      const result = await storage.createItemEstoque(validated);
      res.status(201).json(result);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  app.patch("/api/estoque/:id", requireAuth, requireRole("ADMIN"), async (req, res) => {
    try {
      const validated = insertItemEstoqueSchema.partial().parse(req.body);
      const result = await storage.updateItemEstoque(Number(req.params.id), validated);
      if (!result) return res.status(404).json({ message: "Item nao encontrado" });
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  app.get("/api/estoque/movimentacoes", requireAuth, requireRole("ADMIN", "RECEPCAO"), async (_req, res) => {
    const data = await storage.getMovimentacoesEstoque();
    res.json(data);
  });

  app.post("/api/estoque/movimentacoes", requireAuth, requireRole("ADMIN", "RECEPCAO"), async (req, res) => {
    try {
      const validated = insertMovimentacaoEstoqueSchema.parse(req.body);
      const result = await storage.createMovimentacaoEstoque(validated);
      res.status(201).json(result);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  // Financeiro - ADMIN, FINANCEIRO, RECEPCAO
  app.get("/api/financeiro/recebimentos", requireAuth, requireRole("ADMIN", "FINANCEIRO", "RECEPCAO"), async (_req, res) => {
    const data = await storage.getRecebimentos();
    res.json(data);
  });

  app.post("/api/financeiro/recebimentos", requireAuth, requireRole("ADMIN", "FINANCEIRO", "RECEPCAO"), async (req, res) => {
    try {
      const validated = insertRecebimentoSchema.parse(req.body);
      const result = await storage.createRecebimento(validated);
      res.status(201).json(result);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  app.get("/api/financeiro/pagamentos", requireAuth, requireRole("ADMIN", "FINANCEIRO"), async (_req, res) => {
    const data = await storage.getPagamentos();
    res.json(data);
  });

  app.post("/api/financeiro/pagamentos", requireAuth, requireRole("ADMIN", "FINANCEIRO"), async (req, res) => {
    try {
      const validated = insertPagamentoSchema.parse(req.body);
      const result = await storage.createPagamento(validated);
      res.status(201).json(result);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  return httpServer;
}
