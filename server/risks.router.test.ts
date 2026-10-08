import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock do banco de dados
vi.mock("./db", () => ({
  createRisk: vi.fn().mockResolvedValue({ insertId: 1 }),
  getRiskById: vi.fn().mockResolvedValue(null),
  updateRisk: vi.fn().mockResolvedValue(undefined),
  deleteRisk: vi.fn().mockResolvedValue(undefined),
  listRisks: vi.fn().mockResolvedValue({ data: [], total: 0, page: 1, pageSize: 20 }),
  getDashboardData: vi.fn().mockResolvedValue({
    total: 0, critical: 0, veryHigh: 0, inTreatment: 0, concluded: 0, overdue: 0,
    byCategory: {}, byInherentLevel: {}, byResidualLevel: {}, byStatus: {}, byDecision: {},
    heatmapInherent: Array.from({ length: 5 }, () => Array(5).fill(0)),
    heatmapResidual: Array.from({ length: 5 }, () => Array(5).fill(0)),
  }),
}));

import { createRisk, listRisks } from "./db";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createUserContext(role: "user" | "admin" = "user"): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

const validRiskInput = {
  macroprocessCode: "PROC.FIN.001",
  riskCode: "RISC.FIN.001",
  riskDescription: "Risco de fraude financeira",
  riskEvent: "Desvio de recursos por colaborador",
  riskCategory: "Risco Financeiro" as const,
  impact: 4,
  probability: 3,
  internalControls: "Segregação de funções e aprovação dupla",
  controlEfficacy: "Satisfatório" as const,
  riskCauses: "Falha de controle interno",
  causeCategory: "Falha de Processo" as const,
  riskConsequences: "Perda financeira e dano reputacional",
  consequenceCategory: "Financeira" as const,
  treatmentAction: "Mitigar" as const,
  actionPlanDescription: "Implementar auditoria mensal",
  actionPlanResponsible: "João Silva",
  actionPlanStatus: "Pendente" as const,
};

describe("risks.create", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve criar um risco com cálculos corretos", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.risks.create(validRiskInput);

    expect(result).toEqual({ success: true });
    expect(createRisk).toHaveBeenCalledOnce();

    const callArgs = (createRisk as ReturnType<typeof vi.fn>).mock.calls[0][0];

    // Verificar cálculos: impacto 4 × probabilidade 3 = 12 (risco inerente)
    expect(callArgs.inherentRisk).toBe(12);
    expect(callArgs.inherentRiskLevel).toBe("Alto");

    // Risco residual: 12 × 0.4 (Satisfatório) = 4.8
    expect(callArgs.residualRisk).toBe(4.8);
    expect(callArgs.residualRiskLevel).toBe("Médio");

    // Decisão sugerida para Médio = Monitorar
    expect(callArgs.suggestedDecision).toBe("Monitorar");

    // Verificar que o userId foi associado
    expect(callArgs.createdByUserId).toBe(1);
  });

  it("deve calcular risco crítico corretamente (5×5 = 25)", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    await caller.risks.create({
      ...validRiskInput,
      impact: 5,
      probability: 5,
      controlEfficacy: "Inexistente",
    });

    const callArgs = (createRisk as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(callArgs.inherentRisk).toBe(25);
    expect(callArgs.inherentRiskLevel).toBe("Crítico");
    expect(callArgs.residualRisk).toBe(25); // Inexistente = fator 1.0
    expect(callArgs.residualRiskLevel).toBe("Crítico");
    expect(callArgs.suggestedDecision).toBe("Escalonar");
  });

  it("deve rejeitar criação sem autenticação", async () => {
    const ctx: TrpcContext = {
      user: null,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(ctx);

    await expect(caller.risks.create(validRiskInput)).rejects.toThrow();
  });

  it("deve rejeitar impacto fora do intervalo 1-5", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.risks.create({ ...validRiskInput, impact: 6 })
    ).rejects.toThrow();
  });

  it("deve rejeitar categoria de risco inválida", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.risks.create({ ...validRiskInput, riskCategory: "Categoria Inválida" as any })
    ).rejects.toThrow();
  });
});

describe("risks.list", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve listar riscos do usuário autenticado", async () => {
    const ctx = createUserContext("user");
    const caller = appRouter.createCaller(ctx);

    const result = await caller.risks.list({});

    expect(listRisks).toHaveBeenCalledOnce();
    const callArgs = (listRisks as ReturnType<typeof vi.fn>).mock.calls[0][0];

    // Usuário comum deve ter userId e isAdmin=false
    expect(callArgs.userId).toBe(1);
    expect(callArgs.isAdmin).toBe(false);
  });

  it("admin deve listar todos os riscos", async () => {
    const ctx = createUserContext("admin");
    const caller = appRouter.createCaller(ctx);

    await caller.risks.list({});

    const callArgs = (listRisks as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(callArgs.isAdmin).toBe(true);
  });

  it("deve passar filtros corretamente para o banco", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    await caller.risks.list({
      riskCategory: "Risco Financeiro",
      actionPlanStatus: "Pendente",
      search: "fraude",
      page: 2,
      pageSize: 10,
    });

    const callArgs = (listRisks as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(callArgs.riskCategory).toBe("Risco Financeiro");
    expect(callArgs.actionPlanStatus).toBe("Pendente");
    expect(callArgs.search).toBe("fraude");
    expect(callArgs.page).toBe(2);
    expect(callArgs.pageSize).toBe(10);
  });

  it("deve rejeitar listagem sem autenticação", async () => {
    const ctx: TrpcContext = {
      user: null,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(ctx);

    await expect(caller.risks.list({})).rejects.toThrow();
  });
});
