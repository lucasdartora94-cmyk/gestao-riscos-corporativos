import { and, asc, desc, eq, like, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, risks, users } from "../drizzle/schema";
import type { InsertRisk } from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ───────────────────────────────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;

  for (const field of textFields) {
    const value = user[field];
    if (value === undefined) continue;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  }

  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }

  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ─── Risks ───────────────────────────────────────────────────────────────────

export async function createRisk(data: InsertRisk) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(risks).values(data);
  return result;
}

export async function getRiskById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(risks).where(eq(risks.id, id)).limit(1);
  return result[0] ?? null;
}

export async function updateRisk(id: number, data: Partial<InsertRisk>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(risks).set(data).where(eq(risks.id, id));
}

export async function deleteRisk(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(risks).where(eq(risks.id, id));
}

export interface ListRisksFilters {
  userId?: number;
  isAdmin?: boolean;
  macroprocessCode?: string;
  riskCategory?: string;
  inherentRiskLevel?: string;
  residualRiskLevel?: string;
  actionPlanStatus?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export async function listRisks(filters: ListRisksFilters = {}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const {
    userId,
    isAdmin = false,
    macroprocessCode,
    riskCategory,
    inherentRiskLevel,
    residualRiskLevel,
    actionPlanStatus,
    search,
    page = 1,
    pageSize = 50,
  } = filters;

  const conditions = [];

  if (!isAdmin && userId) {
    conditions.push(eq(risks.createdByUserId, userId));
  }
  if (macroprocessCode) {
    conditions.push(like(risks.macroprocessCode, `%${macroprocessCode}%`));
  }
  if (riskCategory) {
    conditions.push(eq(risks.riskCategory, riskCategory as any));
  }
  if (inherentRiskLevel) {
    conditions.push(eq(risks.inherentRiskLevel, inherentRiskLevel));
  }
  if (residualRiskLevel) {
    conditions.push(eq(risks.residualRiskLevel, residualRiskLevel));
  }
  if (actionPlanStatus) {
    conditions.push(eq(risks.actionPlanStatus, actionPlanStatus as any));
  }
  if (search) {
    conditions.push(
      or(
        like(risks.riskDescription, `%${search}%`),
        like(risks.riskCode, `%${search}%`),
        like(risks.macroprocessCode, `%${search}%`),
        like(risks.actionPlanResponsible, `%${search}%`)
      )
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
  const offset = (page - 1) * pageSize;

  const [rows, countResult] = await Promise.all([
    db
      .select()
      .from(risks)
      .where(whereClause)
      .orderBy(desc(risks.createdAt))
      .limit(pageSize)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(risks)
      .where(whereClause),
  ]);

  return {
    data: rows,
    total: Number(countResult[0]?.count ?? 0),
    page,
    pageSize,
  };
}

export async function getDashboardData(userId?: number, isAdmin = false) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const condition = !isAdmin && userId ? eq(risks.createdByUserId, userId) : undefined;

  const allRisks = await db.select().from(risks).where(condition);

  // Contadores por categoria
  const byCategory: Record<string, number> = {};
  const byInherentLevel: Record<string, number> = {};
  const byResidualLevel: Record<string, number> = {};
  const byStatus: Record<string, number> = {};
  const byDecision: Record<string, number> = {};
  const heatmapInherent: number[][] = Array.from({ length: 5 }, () => Array(5).fill(0));
  const heatmapResidual: number[][] = Array.from({ length: 5 }, () => Array(5).fill(0));

  for (const risk of allRisks) {
    // Categoria
    byCategory[risk.riskCategory] = (byCategory[risk.riskCategory] ?? 0) + 1;

    // Nível inerente
    byInherentLevel[risk.inherentRiskLevel] =
      (byInherentLevel[risk.inherentRiskLevel] ?? 0) + 1;

    // Nível residual
    byResidualLevel[risk.residualRiskLevel] =
      (byResidualLevel[risk.residualRiskLevel] ?? 0) + 1;

    // Status
    byStatus[risk.actionPlanStatus] = (byStatus[risk.actionPlanStatus] ?? 0) + 1;

    // Decisão
    byDecision[risk.suggestedDecision] = (byDecision[risk.suggestedDecision] ?? 0) + 1;

    // Heatmap inerente (impact × probability)
    const pi = risk.probability - 1;
    const ii = risk.impact - 1;
    if (pi >= 0 && pi < 5 && ii >= 0 && ii < 5) {
      heatmapInherent[pi][ii] = (heatmapInherent[pi][ii] ?? 0) + 1;
    }

    // Heatmap residual (usando residualRisk para posicionar)
    const residualScore = risk.residualRisk;
    const residualImpact = Math.min(5, Math.max(1, Math.ceil(Math.sqrt(residualScore))));
    const residualProb = Math.min(5, Math.max(1, Math.round(residualScore / residualImpact)));
    const rpi = residualProb - 1;
    const rii = residualImpact - 1;
    if (rpi >= 0 && rpi < 5 && rii >= 0 && rii < 5) {
      heatmapResidual[rpi][rii] = (heatmapResidual[rpi][rii] ?? 0) + 1;
    }
  }

  return {
    total: allRisks.length,
    critical: allRisks.filter((r) => r.residualRiskLevel === "Crítico").length,
    veryHigh: allRisks.filter((r) => r.residualRiskLevel === "Muito Alto").length,
    inTreatment: allRisks.filter((r) => r.actionPlanStatus === "Em andamento").length,
    concluded: allRisks.filter((r) => r.actionPlanStatus === "Concluído").length,
    overdue: allRisks.filter((r) => r.actionPlanStatus === "Atrasado").length,
    byCategory,
    byInherentLevel,
    byResidualLevel,
    byStatus,
    byDecision,
    heatmapInherent,
    heatmapResidual,
  };
}
