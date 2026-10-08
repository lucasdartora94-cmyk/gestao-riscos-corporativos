import AppLayout from "@/components/AppLayout";
import { RiskBadge, StatusBadge, DecisionBadge } from "@/components/RiskBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc";
import { useLocation, useParams } from "wouter";
import { ArrowLeft, Pencil, Calendar, User, AlertTriangle } from "lucide-react";
import { IMPACT_LABELS, PROBABILITY_LABELS, EFFICACY_FACTORS } from "../../../shared/riskCalculations";

function Field({ label, value }: { label: string; value?: string | number | null }) {
  if (!value && value !== 0) return null;
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className="text-sm text-foreground">{value}</p>
    </div>
  );
}

export default function RiskDetail() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();

  const { data: risk, isLoading } = trpc.risks.getById.useQuery({ id: Number(params.id) });

  if (isLoading) {
    return (
      <AppLayout title="Detalhes do Risco">
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          Carregando...
        </div>
      </AppLayout>
    );
  }

  if (!risk) {
    return (
      <AppLayout title="Risco não encontrado">
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <AlertTriangle className="w-12 h-12 text-muted-foreground" />
          <p className="text-muted-foreground">Risco não encontrado</p>
          <Button onClick={() => setLocation("/riscos")}>Voltar para a lista</Button>
        </div>
      </AppLayout>
    );
  }

  const deadline = risk.actionPlanDeadline
    ? new Date(risk.actionPlanDeadline).toLocaleDateString("pt-BR")
    : null;

  const isOverdue =
    risk.actionPlanDeadline &&
    new Date(risk.actionPlanDeadline) < new Date() &&
    risk.actionPlanStatus !== "Concluído";

  return (
    <AppLayout
      title={risk.riskCode}
      subtitle={risk.macroprocessCode}
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setLocation("/riscos")}>
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Voltar
          </Button>
          <Button size="sm" onClick={() => setLocation(`/riscos/${risk.id}/editar`)}>
            <Pencil className="w-4 h-4 mr-1.5" />
            Editar
          </Button>
        </div>
      }
    >
      <div className="max-w-5xl mx-auto space-y-5">
        {/* Header card */}
        <Card className="border-l-4" style={{ borderLeftColor: risk.residualRiskLevel === "Crítico" ? "#7c3aed" : risk.residualRiskLevel === "Muito Alto" ? "#ef4444" : risk.residualRiskLevel === "Alto" ? "#f97316" : risk.residualRiskLevel === "Médio" ? "#eab308" : "#22c55e" }}>
          <CardContent className="pt-5 pb-5">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground font-mono mb-1">{risk.riskCategory}</p>
                <h2 className="text-lg font-semibold text-foreground">{risk.riskDescription}</h2>
                <p className="text-sm text-muted-foreground mt-1">{risk.riskEvent}</p>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">Inerente</p>
                  <p className="text-2xl font-bold">{risk.inherentRisk}</p>
                  <RiskBadge level={risk.inherentRiskLevel} size="sm" />
                </div>
                <div className="w-px h-12 bg-border" />
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">Residual</p>
                  <p className="text-2xl font-bold">{risk.residualRisk}</p>
                  <RiskBadge level={risk.residualRiskLevel} size="sm" />
                </div>
                <div className="w-px h-12 bg-border" />
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">Decisão</p>
                  <DecisionBadge decision={risk.suggestedDecision} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Avaliação */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Avaliação do Risco Inerente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-muted/50 text-center">
                  <p className="text-xs text-muted-foreground">Impacto</p>
                  <p className="text-2xl font-bold mt-1">{risk.impact}</p>
                  <p className="text-xs text-muted-foreground">{IMPACT_LABELS[risk.impact]}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50 text-center">
                  <p className="text-xs text-muted-foreground">Probabilidade</p>
                  <p className="text-2xl font-bold mt-1">{risk.probability}</p>
                  <p className="text-xs text-muted-foreground">{PROBABILITY_LABELS[risk.probability]}</p>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-muted/50 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Risco Inerente</p>
                  <p className="text-xs text-muted-foreground">{risk.impact} × {risk.probability}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold">{risk.inherentRisk}</span>
                  <RiskBadge level={risk.inherentRiskLevel} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Controles */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Controles e Risco Residual</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Field label="Controles Internos" value={risk.internalControls} />
              <div className="p-3 rounded-lg bg-muted/50 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Eficácia do Controle</p>
                  <p className="text-sm font-medium">{risk.controlEfficacy}</p>
                  <p className="text-xs text-muted-foreground">Fator: {EFFICACY_FACTORS[risk.controlEfficacy]}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold">{risk.residualRisk}</span>
                  <RiskBadge level={risk.residualRiskLevel} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Causas */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Diagnóstico Causal</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Field label="Causas do Risco" value={risk.riskCauses} />
              {risk.causeClassification && <Field label="Classificação da Causa" value={risk.causeClassification} />}
              <Field label="Categoria da Causa" value={risk.causeCategory} />
            </CardContent>
          </Card>

          {/* Consequências */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Consequências</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Field label="Consequências do Risco" value={risk.riskConsequences} />
              {risk.consequenceClassification && <Field label="Classificação da Consequência" value={risk.consequenceClassification} />}
              <Field label="Categoria da Consequência" value={risk.consequenceCategory} />
            </CardContent>
          </Card>
        </div>

        {/* Plano de Ação */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Plano de Ação e Tratamento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 flex-wrap">
              <div>
                <p className="text-xs text-muted-foreground">Ação de Tratamento</p>
                <DecisionBadge decision={risk.treatmentAction} className="mt-1" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Status</p>
                <StatusBadge status={risk.actionPlanStatus} className="mt-1" />
              </div>
              {deadline && (
                <div>
                  <p className="text-xs text-muted-foreground">Prazo</p>
                  <div className={`flex items-center gap-1 mt-1 text-sm font-medium ${isOverdue ? "text-destructive" : "text-foreground"}`}>
                    <Calendar className="w-3.5 h-3.5" />
                    {deadline}
                    {isOverdue && <span className="text-xs text-destructive ml-1">(Atrasado)</span>}
                  </div>
                </div>
              )}
              <div>
                <p className="text-xs text-muted-foreground">Responsável</p>
                <div className="flex items-center gap-1 mt-1 text-sm font-medium">
                  <User className="w-3.5 h-3.5 text-muted-foreground" />
                  {risk.actionPlanResponsible}
                </div>
              </div>
            </div>
            <Separator />
            <Field label="Plano de Ação" value={risk.actionPlanDescription} />
            {risk.financialConformityDescription && (
              <Field label="Descrição Financeiro/Conformidade" value={risk.financialConformityDescription} />
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
