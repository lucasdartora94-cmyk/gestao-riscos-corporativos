import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  createRisk,
  deleteRisk,
  getDashboardData,
  getRiskById,
  listRisks,
  updateRisk,
} from "./db";
import {
  calculateInherentRisk,
  calculateResidualRisk,
  classifyRiskLevel,
  suggestDecision,
} from "../shared/riskCalculations";

// ─── Schemas de validação ─────────────────────────────────────────────────────

const riskCategoryEnum = z.enum([
  "Risco Estratégico",
  "Risco Financeiro",
  "Risco de Imagem",
  "Risco Operacional",
  "Risco de Conformidade",
  "Risco de Integridade",
]);

const causeCategoryEnum = z.enum([
  "Falha Humana",
  "Falha Tecnológica",
  "Desvio de Conduta",
  "Falha de Processo",
  "Falha de Equipamentos ou Infraestrutura",
  "Ação de Terceiros",
  "Eventos da Natureza",
]);

const consequenceCategoryEnum = z.enum([
  "Financeira",
  "Reputacional",
  "Operacional",
  "Legal e Regulatória",
  "Danos Ambientais",
  "Danos Sociais",
]);

const controlEfficacyEnum = z.enum([
  "Inexistente",
  "Fraco",
  "Mediano",
  "Satisfatório",
  "Forte",
]);

const treatmentActionEnum = z.enum(["Aceitar", "Monitorar", "Mitigar", "Escalonar"]);

const actionStatusEnum = z.enum([
  "Pendente",
  "Em andamento",
  "Concluído",
  "Atrasado",
]);

const riskInputSchema = z.object({
  macroprocessCode: z.string().min(1, "Código do macroprocesso é obrigatório"),
  riskCode: z.string().min(1, "Código do risco é obrigatório"),
  riskDescription: z.string().min(1, "Descrição do risco é obrigatória"),
  riskEvent: z.string().min(1, "Evento de risco é obrigatório"),
  riskCategory: riskCategoryEnum,
  financialConformityDescription: z.string().optional(),
  impact: z.number().int().min(1).max(5),
  probability: z.number().int().min(1).max(5),
  internalControls: z.string().min(1, "Controles internos são obrigatórios"),
  controlEfficacy: controlEfficacyEnum,
  riskCauses: z.string().min(1, "Causas do risco são obrigatórias"),
  causeClassification: z.string().optional(),
  causeCategory: causeCategoryEnum,
  riskConsequences: z.string().min(1, "Consequências do risco são obrigatórias"),
  consequenceClassification: z.string().optional(),
  consequenceCategory: consequenceCategoryEnum,
  treatmentAction: treatmentActionEnum,
  actionPlanDescription: z.string().min(1, "Plano de ação é obrigatório"),
  actionPlanDeadline: z.string().optional().nullable(),
  actionPlanResponsible: z.string().min(1, "Responsável é obrigatório"),
  actionPlanStatus: actionStatusEnum,
});

// ─── Router de Riscos ─────────────────────────────────────────────────────────

const risksRouter = router({
  create: protectedProcedure.input(riskInputSchema).mutation(async ({ ctx, input }) => {
    const inherentRisk = calculateInherentRisk(input.impact, input.probability);
    const inherentRiskLevel = classifyRiskLevel(inherentRisk);
    const residualRisk = calculateResidualRisk(inherentRisk, input.controlEfficacy);
    const residualRiskLevel = classifyRiskLevel(residualRisk);
    const suggestedDecision = suggestDecision(residualRisk, residualRiskLevel);

    await createRisk({
      createdByUserId: ctx.user.id,
      macroprocessCode: input.macroprocessCode,
      riskCode: input.riskCode,
      riskDescription: input.riskDescription,
      riskEvent: input.riskEvent,
      riskCategory: input.riskCategory,
      financialConformityDescription: input.financialConformityDescription ?? null,
      impact: input.impact,
      probability: input.probability,
      inherentRisk,
      inherentRiskLevel,
      internalControls: input.internalControls,
      controlEfficacy: input.controlEfficacy,
      residualRisk,
      residualRiskLevel,
      riskCauses: input.riskCauses,
      causeClassification: input.causeClassification ?? null,
      causeCategory: input.causeCategory,
      riskConsequences: input.riskConsequences,
      consequenceClassification: input.consequenceClassification ?? null,
      consequenceCategory: input.consequenceCategory,
      treatmentAction: input.treatmentAction,
      actionPlanDescription: input.actionPlanDescription,
      actionPlanDeadline: input.actionPlanDeadline ? new Date(input.actionPlanDeadline) as any : null,
      actionPlanResponsible: input.actionPlanResponsible,
      actionPlanStatus: input.actionPlanStatus,
      suggestedDecision,
    });

    return { success: true };
  }),

  list: protectedProcedure
    .input(
      z.object({
        macroprocessCode: z.string().optional(),
        riskCategory: z.string().optional(),
        inherentRiskLevel: z.string().optional(),
        residualRiskLevel: z.string().optional(),
        actionPlanStatus: z.string().optional(),
        search: z.string().optional(),
        page: z.number().int().min(1).default(1),
        pageSize: z.number().int().min(1).max(100).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const isAdmin = ctx.user.role === "admin";
      return listRisks({
        userId: ctx.user.id,
        isAdmin,
        ...input,
      });
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.number().int() }))
    .query(async ({ ctx, input }) => {
      const risk = await getRiskById(input.id);
      if (!risk) throw new TRPCError({ code: "NOT_FOUND", message: "Risco não encontrado" });

      const isAdmin = ctx.user.role === "admin";
      if (!isAdmin && risk.createdByUserId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
      }

      return risk;
    }),

  update: protectedProcedure
    .input(z.object({ id: z.number().int() }).merge(riskInputSchema))
    .mutation(async ({ ctx, input }) => {
      const existing = await getRiskById(input.id);
      if (!existing) throw new TRPCError({ code: "NOT_FOUND" });

      const isAdmin = ctx.user.role === "admin";
      if (!isAdmin && existing.createdByUserId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const inherentRisk = calculateInherentRisk(input.impact, input.probability);
      const inherentRiskLevel = classifyRiskLevel(inherentRisk);
      const residualRisk = calculateResidualRisk(inherentRisk, input.controlEfficacy);
      const residualRiskLevel = classifyRiskLevel(residualRisk);
      const suggestedDecision = suggestDecision(residualRisk, residualRiskLevel);

      await updateRisk(input.id, {
        macroprocessCode: input.macroprocessCode,
        riskCode: input.riskCode,
        riskDescription: input.riskDescription,
        riskEvent: input.riskEvent,
        riskCategory: input.riskCategory,
        financialConformityDescription: input.financialConformityDescription ?? null,
        impact: input.impact,
        probability: input.probability,
        inherentRisk,
        inherentRiskLevel,
        internalControls: input.internalControls,
        controlEfficacy: input.controlEfficacy,
        residualRisk,
        residualRiskLevel,
        riskCauses: input.riskCauses,
        causeClassification: input.causeClassification ?? null,
        causeCategory: input.causeCategory,
        riskConsequences: input.riskConsequences,
        consequenceClassification: input.consequenceClassification ?? null,
        consequenceCategory: input.consequenceCategory,
        treatmentAction: input.treatmentAction,
        actionPlanDescription: input.actionPlanDescription,
        actionPlanDeadline: input.actionPlanDeadline ? new Date(input.actionPlanDeadline) as any : null,
        actionPlanResponsible: input.actionPlanResponsible,
        actionPlanStatus: input.actionPlanStatus,
        suggestedDecision,
      });

      return { success: true };
    }),

  updateStatus: protectedProcedure
    .input(
      z.object({
        id: z.number().int(),
        actionPlanStatus: actionStatusEnum,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await getRiskById(input.id);
      if (!existing) throw new TRPCError({ code: "NOT_FOUND" });

      const isAdmin = ctx.user.role === "admin";
      if (!isAdmin && existing.createdByUserId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      await updateRisk(input.id, { actionPlanStatus: input.actionPlanStatus });
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await getRiskById(input.id);
      if (!existing) throw new TRPCError({ code: "NOT_FOUND" });

      const isAdmin = ctx.user.role === "admin";
      if (!isAdmin && existing.createdByUserId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      await deleteRisk(input.id);
      return { success: true };
    }),

  dashboard: protectedProcedure.query(async ({ ctx }) => {
    const isAdmin = ctx.user.role === "admin";
    return getDashboardData(ctx.user.id, isAdmin);
  }),

  exportExcel: protectedProcedure
    .input(
      z.object({
        macroprocessCode: z.string().optional(),
        riskCategory: z.string().optional(),
        actionPlanStatus: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const isAdmin = ctx.user.role === "admin";
      const { data } = await listRisks({
        userId: ctx.user.id,
        isAdmin,
        macroprocessCode: input.macroprocessCode,
        riskCategory: input.riskCategory,
        actionPlanStatus: input.actionPlanStatus,
        pageSize: 10000,
      });

      // Gerar Excel com ExcelJS
      const ExcelJS = await import("exceljs");
      const workbook = new ExcelJS.Workbook();
      workbook.creator = "Sistema de Gestão de Riscos";
      workbook.created = new Date();

      const ws = workbook.addWorksheet("Gestão de Riscos", {
        pageSetup: { fitToPage: true, orientation: "landscape" },
      });

      // Cabeçalho principal
      ws.mergeCells("A1:X1");
      const titleCell = ws.getCell("A1");
      titleCell.value = "GESTÃO DE RISCOS CORPORATIVOS";
      titleCell.font = { bold: true, size: 14, color: { argb: "FFFFFFFF" } };
      titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E3A5F" } };
      titleCell.alignment = { horizontal: "center", vertical: "middle" };
      ws.getRow(1).height = 30;

      // Cabeçalhos das colunas
      const headers = [
        "Código Macroprocesso",
        "Código do Risco",
        "Qual é o Risco?",
        "Evento de Risco",
        "Categoria do Risco",
        "Descrição Financeiro/Conformidade",
        "Impacto",
        "Probabilidade",
        "Risco Inerente",
        "Nível Inerente",
        "Controles Internos",
        "Eficácia do Controle",
        "Risco Residual",
        "Nível Residual",
        "Causas do Risco",
        "Classif. Causa",
        "Categoria da Causa",
        "Consequências",
        "Classif. Consequência",
        "Categoria da Consequência",
        "Ação de Tratamento",
        "Plano de Ação",
        "Prazo",
        "Responsável",
        "Status",
        "Decisão Sugerida",
      ];

      const headerRow = ws.getRow(2);
      headers.forEach((h, i) => {
        const cell = headerRow.getCell(i + 1);
        cell.value = h;
        cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 10 };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2D5986" } };
        cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });
      headerRow.height = 40;

      // Mapeamento de cores por nível
      const levelColors: Record<string, string> = {
        Baixo: "FFD1FAE5",
        Médio: "FFFEF9C3",
        Alto: "FFFFEDD5",
        "Muito Alto": "FFFEE2E2",
        Crítico: "FFEDE9FE",
      };

      // Linhas de dados
      data.forEach((risk, idx) => {
        const row = ws.getRow(idx + 3);
        const rowData = [
          risk.macroprocessCode,
          risk.riskCode,
          risk.riskDescription,
          risk.riskEvent,
          risk.riskCategory,
          risk.financialConformityDescription ?? "",
          risk.impact,
          risk.probability,
          risk.inherentRisk,
          risk.inherentRiskLevel,
          risk.internalControls,
          risk.controlEfficacy,
          risk.residualRisk,
          risk.residualRiskLevel,
          risk.riskCauses,
          risk.causeClassification ?? "",
          risk.causeCategory,
          risk.riskConsequences,
          risk.consequenceClassification ?? "",
          risk.consequenceCategory,
          risk.treatmentAction,
          risk.actionPlanDescription,
          risk.actionPlanDeadline
            ? new Date(risk.actionPlanDeadline).toLocaleDateString("pt-BR")
            : "",
          risk.actionPlanResponsible,
          risk.actionPlanStatus,
          risk.suggestedDecision,
        ];

        rowData.forEach((val, i) => {
          const cell = row.getCell(i + 1);
          cell.value = val;
          cell.alignment = { vertical: "middle", wrapText: true };
          cell.border = {
            top: { style: "thin", color: { argb: "FFE5E7EB" } },
            left: { style: "thin", color: { argb: "FFE5E7EB" } },
            bottom: { style: "thin", color: { argb: "FFE5E7EB" } },
            right: { style: "thin", color: { argb: "FFE5E7EB" } },
          };

          // Colorir células de nível de risco
          if (i === 9 || i === 13) {
            const color = levelColors[String(val)] ?? "FFFFFFFF";
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: color } };
            cell.font = { bold: true };
          }

          // Zebra striping
          if (idx % 2 === 0) {
            if (i !== 9 && i !== 13) {
              cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF9FAFB" } };
            }
          }
        });

        row.height = 35;
      });

      // Larguras das colunas
      const colWidths = [18, 18, 35, 35, 22, 30, 10, 12, 12, 14, 40, 16, 14, 14, 40, 25, 25, 40, 25, 25, 18, 40, 14, 25, 16, 18];
      colWidths.forEach((w, i) => {
        ws.getColumn(i + 1).width = w;
      });

      // Congelar cabeçalhos
      ws.views = [{ state: "frozen", xSplit: 0, ySplit: 2 }];

      const buffer = await workbook.xlsx.writeBuffer();
      const base64 = Buffer.from(buffer).toString("base64");
      return { base64, filename: `matriz-riscos-${new Date().toISOString().slice(0, 10)}.xlsx` };
    }),
});

// ─── App Router ───────────────────────────────────────────────────────────────

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  risks: risksRouter,
});

export type AppRouter = typeof appRouter;
