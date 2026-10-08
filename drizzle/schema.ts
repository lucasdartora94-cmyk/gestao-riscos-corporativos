import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  float,
  date,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Matriz de Riscos ────────────────────────────────────────────────────────

export const risks = mysqlTable("risks", {
  id: int("id").autoincrement().primaryKey(),
  createdByUserId: int("createdByUserId").notNull(),

  // Campo 1 - Código do macroprocesso
  macroprocessCode: varchar("macroprocessCode", { length: 100 }).notNull(),

  // Campo 2 - Código do risco
  riskCode: varchar("riskCode", { length: 100 }).notNull(),

  // Campo 3 - Qual é o risco? (descrição)
  riskDescription: text("riskDescription").notNull(),

  // Campo 4 - O que pode acontecer que atrapalhe o alcance do objetivo?
  riskEvent: text("riskEvent").notNull(),

  // Campo 5 - Categoria do risco
  riskCategory: mysqlEnum("riskCategory", [
    "Risco Estratégico",
    "Risco Financeiro",
    "Risco de Imagem",
    "Risco Operacional",
    "Risco de Conformidade",
    "Risco de Integridade",
  ]).notNull(),

  // Campo 6 - Descrição financeiro e conformidade
  financialConformityDescription: text("financialConformityDescription"),

  // Campo 7 - Impacto (1-5)
  impact: int("impact").notNull(),

  // Campo 8 - Probabilidade (1-5)
  probability: int("probability").notNull(),

  // Campo 9 - Risco inerente (calculado: impacto × probabilidade)
  inherentRisk: int("inherentRisk").notNull(),

  // Nível do risco inerente (texto)
  inherentRiskLevel: varchar("inherentRiskLevel", { length: 50 }).notNull(),

  // Campo 10 - Controles internos existentes
  internalControls: text("internalControls").notNull(),

  // Campo 11 - Eficácia do controle
  controlEfficacy: mysqlEnum("controlEfficacy", [
    "Inexistente",
    "Fraco",
    "Mediano",
    "Satisfatório",
    "Forte",
  ]).notNull(),

  // Campo 12 - Risco residual (calculado: risco inerente × fator de eficácia)
  residualRisk: float("residualRisk").notNull(),

  // Nível do risco residual (texto)
  residualRiskLevel: varchar("residualRiskLevel", { length: 50 }).notNull(),

  // Campo 13 - Causas do risco
  riskCauses: text("riskCauses").notNull(),

  // Campo 14 - Classificação da causa
  causeClassification: varchar("causeClassification", { length: 200 }),

  // Campo 15 - Categoria da causa
  causeCategory: mysqlEnum("causeCategory", [
    "Falha Humana",
    "Falha Tecnológica",
    "Desvio de Conduta",
    "Falha de Processo",
    "Falha de Equipamentos ou Infraestrutura",
    "Ação de Terceiros",
    "Eventos da Natureza",
  ]).notNull(),

  // Campo 16 - Consequências do risco
  riskConsequences: text("riskConsequences").notNull(),

  // Campo 17 - Classificação da consequência
  consequenceClassification: varchar("consequenceClassification", { length: 200 }),

  // Campo 18 - Categoria da consequência
  consequenceCategory: mysqlEnum("consequenceCategory", [
    "Financeira",
    "Reputacional",
    "Operacional",
    "Legal e Regulatória",
    "Danos Ambientais",
    "Danos Sociais",
  ]).notNull(),

  // Campo 19 - Ação de tratamento
  treatmentAction: mysqlEnum("treatmentAction", [
    "Aceitar",
    "Monitorar",
    "Mitigar",
    "Escalonar",
  ]).notNull(),

  // Campo 20 - Plano de ação (descrição)
  actionPlanDescription: text("actionPlanDescription").notNull(),

  // Campo 21 - Prazo de implementação
  actionPlanDeadline: date("actionPlanDeadline"),

  // Campo 22 - Responsável
  actionPlanResponsible: varchar("actionPlanResponsible", { length: 200 }).notNull(),

  // Campo 23 - Status das ações
  actionPlanStatus: mysqlEnum("actionPlanStatus", [
    "Pendente",
    "Em andamento",
    "Concluído",
    "Atrasado",
  ])
    .default("Pendente")
    .notNull(),

  // Sugestão de decisão gerada automaticamente
  suggestedDecision: mysqlEnum("suggestedDecision", [
    "Aceitar",
    "Monitorar",
    "Mitigar",
    "Escalonar",
  ]).notNull(),

  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Risk = typeof risks.$inferSelect;
export type InsertRisk = typeof risks.$inferInsert;
