// ─── Constantes metodológicas ────────────────────────────────────────────────

export const IMPACT_LABELS: Record<number, string> = {
  1: "Muito baixo",
  2: "Baixo",
  3: "Moderado",
  4: "Alto",
  5: "Muito alto",
};

export const PROBABILITY_LABELS: Record<number, string> = {
  1: "Improvável",
  2: "Rara",
  3: "Possível",
  4: "Provável",
  5: "Praticamente certa",
};

export const EFFICACY_FACTORS: Record<string, number> = {
  Inexistente: 1.0,
  Fraco: 0.8,
  Mediano: 0.6,
  Satisfatório: 0.4,
  Forte: 0.2,
};

export const RISK_CATEGORIES = [
  "Risco Estratégico",
  "Risco Financeiro",
  "Risco de Imagem",
  "Risco Operacional",
  "Risco de Conformidade",
  "Risco de Integridade",
] as const;

export const CAUSE_CATEGORIES = [
  "Falha Humana",
  "Falha Tecnológica",
  "Desvio de Conduta",
  "Falha de Processo",
  "Falha de Equipamentos ou Infraestrutura",
  "Ação de Terceiros",
  "Eventos da Natureza",
] as const;

export const CONSEQUENCE_CATEGORIES = [
  "Financeira",
  "Reputacional",
  "Operacional",
  "Legal e Regulatória",
  "Danos Ambientais",
  "Danos Sociais",
] as const;

export const TREATMENT_ACTIONS = [
  "Aceitar",
  "Monitorar",
  "Mitigar",
  "Escalonar",
] as const;

export const ACTION_STATUSES = [
  "Pendente",
  "Em andamento",
  "Concluído",
  "Atrasado",
] as const;

export const CONTROL_EFFICACY_OPTIONS = [
  "Inexistente",
  "Fraco",
  "Mediano",
  "Satisfatório",
  "Forte",
] as const;

// ─── Cálculos ────────────────────────────────────────────────────────────────

/**
 * Calcula o risco inerente: impacto × probabilidade
 */
export function calculateInherentRisk(impact: number, probability: number): number {
  return impact * probability;
}

/**
 * Classifica o nível de risco com base no score
 * Escala: 1-4 Baixo | 5-9 Médio | 10-14 Alto | 15-19 Muito Alto | 20-25 Crítico
 */
export function classifyRiskLevel(score: number): string {
  if (score <= 4) return "Baixo";
  if (score <= 9) return "Médio";
  if (score <= 14) return "Alto";
  if (score <= 19) return "Muito Alto";
  return "Crítico";
}

/**
 * Calcula o risco residual: risco inerente × fator de eficácia do controle
 */
export function calculateResidualRisk(
  inherentRisk: number,
  controlEfficacy: string
): number {
  const factor = EFFICACY_FACTORS[controlEfficacy] ?? 1.0;
  return parseFloat((inherentRisk * factor).toFixed(2));
}

/**
 * Sugere a decisão de tratamento com base no risco residual
 */
export function suggestDecision(
  residualRisk: number,
  residualRiskLevel: string
): "Aceitar" | "Monitorar" | "Mitigar" | "Escalonar" {
  if (residualRiskLevel === "Crítico") return "Escalonar";
  if (residualRiskLevel === "Muito Alto") return "Escalonar";
  if (residualRiskLevel === "Alto") return "Mitigar";
  if (residualRiskLevel === "Médio") return "Monitorar";
  return "Aceitar";
}

/**
 * Retorna a cor associada ao nível de risco
 */
export function getRiskLevelColor(level: string): string {
  switch (level) {
    case "Baixo":
      return "#22c55e";
    case "Médio":
      return "#eab308";
    case "Alto":
      return "#f97316";
    case "Muito Alto":
      return "#ef4444";
    case "Crítico":
      return "#7c3aed";
    default:
      return "#6b7280";
  }
}

/**
 * Retorna a cor do badge de status do plano de ação
 */
export function getActionStatusColor(status: string): string {
  switch (status) {
    case "Concluído":
      return "green";
    case "Em andamento":
      return "blue";
    case "Pendente":
      return "yellow";
    case "Atrasado":
      return "red";
    default:
      return "gray";
  }
}

/**
 * Retorna a cor da decisão sugerida
 */
export function getDecisionColor(decision: string): string {
  switch (decision) {
    case "Aceitar":
      return "#22c55e";
    case "Monitorar":
      return "#3b82f6";
    case "Mitigar":
      return "#f97316";
    case "Escalonar":
      return "#ef4444";
    default:
      return "#6b7280";
  }
}

/**
 * Retorna a cor da célula do heatmap 5×5
 */
export function getHeatmapColor(impact: number, probability: number): string {
  const score = impact * probability;
  if (score <= 4) return "#dcfce7"; // verde claro
  if (score <= 9) return "#fef9c3"; // amarelo claro
  if (score <= 14) return "#ffedd5"; // laranja claro
  if (score <= 19) return "#fee2e2"; // vermelho claro
  return "#ede9fe"; // roxo claro (crítico)
}
