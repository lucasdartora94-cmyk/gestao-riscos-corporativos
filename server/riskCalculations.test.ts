import { describe, expect, it } from "vitest";
import {
  calculateInherentRisk,
  calculateResidualRisk,
  classifyRiskLevel,
  suggestDecision,
  EFFICACY_FACTORS,
} from "../shared/riskCalculations";

describe("calculateInherentRisk", () => {
  it("calcula impacto × probabilidade corretamente", () => {
    expect(calculateInherentRisk(3, 4)).toBe(12);
    expect(calculateInherentRisk(5, 5)).toBe(25);
    expect(calculateInherentRisk(1, 1)).toBe(1);
    expect(calculateInherentRisk(2, 3)).toBe(6);
  });
});

describe("classifyRiskLevel", () => {
  it("classifica Baixo para scores de 1 a 4", () => {
    expect(classifyRiskLevel(1)).toBe("Baixo");
    expect(classifyRiskLevel(4)).toBe("Baixo");
  });

  it("classifica Médio para scores de 5 a 9", () => {
    expect(classifyRiskLevel(5)).toBe("Médio");
    expect(classifyRiskLevel(9)).toBe("Médio");
  });

  it("classifica Alto para scores de 10 a 14", () => {
    expect(classifyRiskLevel(10)).toBe("Alto");
    expect(classifyRiskLevel(14)).toBe("Alto");
  });

  it("classifica Muito Alto para scores de 15 a 19", () => {
    expect(classifyRiskLevel(15)).toBe("Muito Alto");
    expect(classifyRiskLevel(19)).toBe("Muito Alto");
  });

  it("classifica Crítico para scores de 20 a 25", () => {
    expect(classifyRiskLevel(20)).toBe("Crítico");
    expect(classifyRiskLevel(25)).toBe("Crítico");
  });
});

describe("calculateResidualRisk", () => {
  it("aplica fator Inexistente = 1.0 (sem redução)", () => {
    expect(calculateResidualRisk(12, "Inexistente")).toBe(12);
  });

  it("aplica fator Fraco = 0.8", () => {
    expect(calculateResidualRisk(10, "Fraco")).toBe(8);
  });

  it("aplica fator Mediano = 0.6", () => {
    expect(calculateResidualRisk(10, "Mediano")).toBe(6);
  });

  it("aplica fator Satisfatório = 0.4", () => {
    expect(calculateResidualRisk(10, "Satisfatório")).toBe(4);
  });

  it("aplica fator Forte = 0.2", () => {
    expect(calculateResidualRisk(10, "Forte")).toBe(2);
  });

  it("mantém precisão decimal", () => {
    expect(calculateResidualRisk(15, "Mediano")).toBe(9);
    expect(calculateResidualRisk(12, "Satisfatório")).toBe(4.8);
  });
});

describe("suggestDecision", () => {
  it("sugere Aceitar para risco Baixo", () => {
    expect(suggestDecision(3, "Baixo")).toBe("Aceitar");
  });

  it("sugere Monitorar para risco Médio", () => {
    expect(suggestDecision(7, "Médio")).toBe("Monitorar");
  });

  it("sugere Mitigar para risco Alto", () => {
    expect(suggestDecision(12, "Alto")).toBe("Mitigar");
  });

  it("sugere Escalonar para risco Muito Alto", () => {
    expect(suggestDecision(18, "Muito Alto")).toBe("Escalonar");
  });

  it("sugere Escalonar para risco Crítico", () => {
    expect(suggestDecision(25, "Crítico")).toBe("Escalonar");
  });
});

describe("EFFICACY_FACTORS", () => {
  it("tem os valores corretos conforme metodologia", () => {
    expect(EFFICACY_FACTORS["Inexistente"]).toBe(1.0);
    expect(EFFICACY_FACTORS["Fraco"]).toBe(0.8);
    expect(EFFICACY_FACTORS["Mediano"]).toBe(0.6);
    expect(EFFICACY_FACTORS["Satisfatório"]).toBe(0.4);
    expect(EFFICACY_FACTORS["Forte"]).toBe(0.2);
  });
});
