import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc";
import {
  RISK_CATEGORIES,
  CAUSE_CATEGORIES,
  CONSEQUENCE_CATEGORIES,
  CONTROL_EFFICACY_OPTIONS,
  TREATMENT_ACTIONS,
  ACTION_STATUSES,
  IMPACT_LABELS,
  PROBABILITY_LABELS,
  calculateInherentRisk,
  calculateResidualRisk,
  classifyRiskLevel,
  suggestDecision,
} from "../../../shared/riskCalculations";
import { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import { toast } from "sonner";
import { RiskBadge, DecisionBadge } from "@/components/RiskBadge";
import { ArrowLeft, Save, Calculator } from "lucide-react";
import { cn } from "@/lib/utils";

type FormData = {
  macroprocessCode: string;
  riskCode: string;
  riskDescription: string;
  riskEvent: string;
  riskCategory: string;
  financialConformityDescription: string;
  impact: number;
  probability: number;
  internalControls: string;
  controlEfficacy: string;
  riskCauses: string;
  causeClassification: string;
  causeCategory: string;
  riskConsequences: string;
  consequenceClassification: string;
  consequenceCategory: string;
  treatmentAction: string;
  actionPlanDescription: string;
  actionPlanDeadline: string;
  actionPlanResponsible: string;
  actionPlanStatus: string;
};

const initialForm: FormData = {
  macroprocessCode: "",
  riskCode: "",
  riskDescription: "",
  riskEvent: "",
  riskCategory: "",
  financialConformityDescription: "",
  impact: 3,
  probability: 3,
  internalControls: "",
  controlEfficacy: "",
  riskCauses: "",
  causeClassification: "",
  causeCategory: "",
  riskConsequences: "",
  consequenceClassification: "",
  consequenceCategory: "",
  treatmentAction: "",
  actionPlanDescription: "",
  actionPlanDeadline: "",
  actionPlanResponsible: "",
  actionPlanStatus: "Pendente",
};

function ScaleSelector({
  value,
  onChange,
  labels,
  name,
}: {
  value: number;
  onChange: (v: number) => void;
  labels: Record<number, string>;
  name: string;
}) {
  const colors = ["", "bg-emerald-500", "bg-yellow-400", "bg-orange-400", "bg-red-400", "bg-purple-500"];
  return (
    <div className="flex gap-2 flex-wrap">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className={cn(
            "flex flex-col items-center gap-1 px-3 py-2 rounded-lg border-2 text-xs font-medium transition-all min-w-[80px]",
            value === n
              ? `${colors[n]} text-white border-transparent shadow-md scale-105`
              : "bg-background border-border text-muted-foreground hover:border-primary/50"
          )}
        >
          <span className="text-lg font-bold">{n}</span>
          <span className="text-center leading-tight">{labels[n]}</span>
        </button>
      ))}
    </div>
  );
}

export default function RiskForm() {
  const params = useParams<{ id?: string }>();
  const isEdit = !!params.id;
  const [, setLocation] = useLocation();
  const [form, setForm] = useState<FormData>(initialForm);

  const utils = trpc.useUtils();

  // Buscar risco para edição
  const { data: existingRisk } = trpc.risks.getById.useQuery(
    { id: Number(params.id) },
    { enabled: isEdit }
  );

  useEffect(() => {
    if (existingRisk) {
      setForm({
        macroprocessCode: existingRisk.macroprocessCode,
        riskCode: existingRisk.riskCode,
        riskDescription: existingRisk.riskDescription,
        riskEvent: existingRisk.riskEvent,
        riskCategory: existingRisk.riskCategory,
        financialConformityDescription: existingRisk.financialConformityDescription ?? "",
        impact: existingRisk.impact,
        probability: existingRisk.probability,
        internalControls: existingRisk.internalControls,
        controlEfficacy: existingRisk.controlEfficacy,
        riskCauses: existingRisk.riskCauses,
        causeClassification: existingRisk.causeClassification ?? "",
        causeCategory: existingRisk.causeCategory,
        riskConsequences: existingRisk.riskConsequences,
        consequenceClassification: existingRisk.consequenceClassification ?? "",
        consequenceCategory: existingRisk.consequenceCategory,
        treatmentAction: existingRisk.treatmentAction,
        actionPlanDescription: existingRisk.actionPlanDescription,
        actionPlanDeadline: existingRisk.actionPlanDeadline
          ? String(existingRisk.actionPlanDeadline).slice(0, 10)
          : "",
        actionPlanResponsible: existingRisk.actionPlanResponsible,
        actionPlanStatus: existingRisk.actionPlanStatus,
      });
    }
  }, [existingRisk]);

  // Cálculos em tempo real
  const inherentRisk = calculateInherentRisk(form.impact, form.probability);
  const inherentRiskLevel = classifyRiskLevel(inherentRisk);
  const residualRisk = form.controlEfficacy
    ? calculateResidualRisk(inherentRisk, form.controlEfficacy)
    : null;
  const residualRiskLevel = residualRisk !== null ? classifyRiskLevel(residualRisk) : null;
  const suggested =
    residualRisk !== null && residualRiskLevel
      ? suggestDecision(residualRisk, residualRiskLevel)
      : null;

  const createMutation = trpc.risks.create.useMutation({
    onSuccess: () => {
      toast.success("Risco cadastrado com sucesso!");
      utils.risks.list.invalidate();
      utils.risks.dashboard.invalidate();
      setLocation("/riscos");
    },
    onError: (e) => toast.error(`Erro: ${e.message}`),
  });

  const updateMutation = trpc.risks.update.useMutation({
    onSuccess: () => {
      toast.success("Risco atualizado com sucesso!");
      utils.risks.list.invalidate();
      utils.risks.dashboard.invalidate();
      setLocation("/riscos");
    },
    onError: (e) => toast.error(`Erro: ${e.message}`),
  });

  const set = (field: keyof FormData, value: string | number) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      macroprocessCode: form.macroprocessCode,
      riskCode: form.riskCode,
      riskDescription: form.riskDescription,
      riskEvent: form.riskEvent,
      riskCategory: form.riskCategory as any,
      financialConformityDescription: form.financialConformityDescription || undefined,
      impact: form.impact,
      probability: form.probability,
      internalControls: form.internalControls,
      controlEfficacy: form.controlEfficacy as any,
      riskCauses: form.riskCauses,
      causeClassification: form.causeClassification || undefined,
      causeCategory: form.causeCategory as any,
      riskConsequences: form.riskConsequences,
      consequenceClassification: form.consequenceClassification || undefined,
      consequenceCategory: form.consequenceCategory as any,
      treatmentAction: form.treatmentAction as any,
      actionPlanDescription: form.actionPlanDescription,
      actionPlanDeadline: form.actionPlanDeadline || null,
      actionPlanResponsible: form.actionPlanResponsible,
      actionPlanStatus: form.actionPlanStatus as any,
    };

    if (isEdit) {
      updateMutation.mutate({ id: Number(params.id), ...payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  const SectionHeader = ({ number, title, description }: { number: string; title: string; description: string }) => (
    <div className="flex items-start gap-3 mb-4">
      <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
        {number}
      </div>
      <div>
        <h3 className="font-semibold text-foreground text-sm">{title}</h3>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  );

  return (
    <AppLayout
      title={isEdit ? "Editar Risco" : "Novo Risco"}
      subtitle={isEdit ? `Editando: ${existingRisk?.riskCode ?? ""}` : "Preencha todos os campos obrigatórios"}
      actions={
        <Button variant="outline" size="sm" onClick={() => setLocation("/riscos")}>
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Voltar
        </Button>
      }
    >
      <form onSubmit={handleSubmit} className="max-w-5xl mx-auto space-y-6">
        {/* Painel de cálculo em tempo real */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 mb-3">
              <Calculator className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-primary">Cálculo em Tempo Real</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">Risco Inerente</p>
                <p className="text-2xl font-bold text-foreground">{inherentRisk}</p>
                <RiskBadge level={inherentRiskLevel} size="sm" className="mt-1" />
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">Eficácia</p>
                <p className="text-sm font-medium text-foreground mt-2">
                  {form.controlEfficacy || "—"}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">Risco Residual</p>
                <p className="text-2xl font-bold text-foreground">
                  {residualRisk !== null ? residualRisk : "—"}
                </p>
                {residualRiskLevel && <RiskBadge level={residualRiskLevel} size="sm" className="mt-1" />}
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">Decisão Sugerida</p>
                <div className="mt-2">
                  {suggested ? <DecisionBadge decision={suggested} /> : <span className="text-sm text-muted-foreground">—</span>}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Seção 1: Identificação */}
        <Card>
          <CardHeader className="pb-2">
            <SectionHeader
              number="1"
              title="Identificação do Risco"
              description="Campos 1 a 5 — Identificação e classificação básica"
            />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="macroprocessCode">
                  1. Código do Macroprocesso <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="macroprocessCode"
                  placeholder="Ex: PROC.FIN.001"
                  value={form.macroprocessCode}
                  onChange={(e) => set("macroprocessCode", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="riskCode">
                  2. Código do Risco <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="riskCode"
                  placeholder="Ex: RISC.FIN.001"
                  value={form.riskCode}
                  onChange={(e) => set("riskCode", e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="riskDescription">
                3. Qual é o risco? <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="riskDescription"
                placeholder="Descreva o risco de forma objetiva e executiva..."
                value={form.riskDescription}
                onChange={(e) => set("riskDescription", e.target.value)}
                required
                rows={2}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="riskEvent">
                4. O que pode acontecer que atrapalhe o objetivo? <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="riskEvent"
                placeholder="Descreva o evento de risco que pode comprometer o objetivo do processo..."
                value={form.riskEvent}
                onChange={(e) => set("riskEvent", e.target.value)}
                required
                rows={2}
              />
            </div>

            <div className="space-y-1.5">
              <Label>
                5. Categoria do Risco <span className="text-destructive">*</span>
              </Label>
              <Select value={form.riskCategory} onValueChange={(v) => set("riskCategory", v)} required>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent>
                  {RISK_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="financialConformityDescription">
                6. Descrição financeiro/conformidade
                <span className="text-muted-foreground text-xs ml-1">(quando aplicável)</span>
              </Label>
              <Textarea
                id="financialConformityDescription"
                placeholder="Para riscos financeiros: detalhe o valor estimado. Para conformidade: detalhe a obrigação normativa..."
                value={form.financialConformityDescription}
                onChange={(e) => set("financialConformityDescription", e.target.value)}
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        {/* Seção 2: Avaliação do Risco Inerente */}
        <Card>
          <CardHeader className="pb-2">
            <SectionHeader
              number="2"
              title="Avaliação do Risco Inerente"
              description="Campos 7 a 9 — Impacto, probabilidade e risco inerente"
            />
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label>
                7. Impacto <span className="text-destructive">*</span>
                <span className="text-muted-foreground text-xs ml-2">Selecionado: {form.impact} — {IMPACT_LABELS[form.impact]}</span>
              </Label>
              <ScaleSelector
                value={form.impact}
                onChange={(v) => set("impact", v)}
                labels={IMPACT_LABELS}
                name="impact"
              />
            </div>

            <div className="space-y-3">
              <Label>
                8. Probabilidade <span className="text-destructive">*</span>
                <span className="text-muted-foreground text-xs ml-2">Selecionado: {form.probability} — {PROBABILITY_LABELS[form.probability]}</span>
              </Label>
              <ScaleSelector
                value={form.probability}
                onChange={(v) => set("probability", v)}
                labels={PROBABILITY_LABELS}
                name="probability"
              />
            </div>

            <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 border">
              <div>
                <p className="text-xs text-muted-foreground">9. Risco Inerente (calculado)</p>
                <p className="text-xs text-muted-foreground">Impacto × Probabilidade = {form.impact} × {form.probability}</p>
              </div>
              <div className="ml-auto flex items-center gap-3">
                <span className="text-3xl font-bold text-foreground">{inherentRisk}</span>
                <RiskBadge level={inherentRiskLevel} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Seção 3: Controles Internos */}
        <Card>
          <CardHeader className="pb-2">
            <SectionHeader
              number="3"
              title="Controles Internos e Risco Residual"
              description="Campos 10 a 12 — Controles existentes, eficácia e risco residual"
            />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="internalControls">
                10. Quais são os controles internos existentes? <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="internalControls"
                placeholder="Liste políticas, procedimentos, auditorias, aprovações, segregação de funções, mecanismos preventivos, detectivos ou corretivos..."
                value={form.internalControls}
                onChange={(e) => set("internalControls", e.target.value)}
                required
                rows={3}
              />
            </div>

            <div className="space-y-1.5">
              <Label>
                11. Como você avalia a eficácia do controle? <span className="text-destructive">*</span>
              </Label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {CONTROL_EFFICACY_OPTIONS.map((opt) => {
                  const descriptions: Record<string, string> = {
                    Inexistente: "Não funcionam",
                    Fraco: "Informais",
                    Mediano: "Parcialmente eficaz",
                    Satisfatório: "Bem desenhados",
                    Forte: "Robustos e formalizados",
                  };
                  const colors: Record<string, string> = {
                    Inexistente: "border-red-300 bg-red-50 text-red-700",
                    Fraco: "border-orange-300 bg-orange-50 text-orange-700",
                    Mediano: "border-yellow-300 bg-yellow-50 text-yellow-700",
                    Satisfatório: "border-blue-300 bg-blue-50 text-blue-700",
                    Forte: "border-green-300 bg-green-50 text-green-700",
                  };
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => set("controlEfficacy", opt)}
                      className={cn(
                        "flex flex-col items-center gap-1 p-3 rounded-lg border-2 text-xs font-medium transition-all",
                        form.controlEfficacy === opt
                          ? `${colors[opt]} border-current shadow-sm scale-105`
                          : "border-border bg-background text-muted-foreground hover:border-primary/50"
                      )}
                    >
                      <span className="font-semibold">{opt}</span>
                      <span className="text-center leading-tight opacity-70">{descriptions[opt]}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {residualRisk !== null && residualRiskLevel && (
              <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 border">
                <div>
                  <p className="text-xs text-muted-foreground">12. Risco Residual (calculado)</p>
                  <p className="text-xs text-muted-foreground">
                    {inherentRisk} × {form.controlEfficacy} = {residualRisk}
                  </p>
                </div>
                <div className="ml-auto flex items-center gap-3">
                  <span className="text-3xl font-bold text-foreground">{residualRisk}</span>
                  <RiskBadge level={residualRiskLevel} />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Seção 4: Causas e Consequências */}
        <Card>
          <CardHeader className="pb-2">
            <SectionHeader
              number="4"
              title="Diagnóstico Causal"
              description="Campos 13 a 18 — Causas e consequências do risco"
            />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="riskCauses">
                    13. Quais são as causas do risco? <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="riskCauses"
                    placeholder="Descreva as fontes e origens do risco..."
                    value={form.riskCauses}
                    onChange={(e) => set("riskCauses", e.target.value)}
                    required
                    rows={3}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="causeClassification">14. Classifique a causa</Label>
                  <Input
                    id="causeClassification"
                    placeholder="Ex: Causa primária, Causa raiz..."
                    value={form.causeClassification}
                    onChange={(e) => set("causeClassification", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>
                    15. Categoria da causa <span className="text-destructive">*</span>
                  </Label>
                  <Select value={form.causeCategory} onValueChange={(v) => set("causeCategory", v)} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {CAUSE_CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="riskConsequences">
                    16. Quais são as consequências do risco? <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="riskConsequences"
                    placeholder="Descreva os efeitos da materialização do risco..."
                    value={form.riskConsequences}
                    onChange={(e) => set("riskConsequences", e.target.value)}
                    required
                    rows={3}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="consequenceClassification">17. Classifique a consequência</Label>
                  <Input
                    id="consequenceClassification"
                    placeholder="Ex: Consequência direta, Consequência secundária..."
                    value={form.consequenceClassification}
                    onChange={(e) => set("consequenceClassification", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>
                    18. Categoria da consequência <span className="text-destructive">*</span>
                  </Label>
                  <Select value={form.consequenceCategory} onValueChange={(v) => set("consequenceCategory", v)} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {CONSEQUENCE_CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Seção 5: Tratamento */}
        <Card>
          <CardHeader className="pb-2">
            <SectionHeader
              number="5"
              title="Tratamento do Risco"
              description="Campos 19 a 23 — Ação de tratamento e plano de ação"
            />
          </CardHeader>
          <CardContent className="space-y-4">
            {suggested && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border">
                <p className="text-sm text-muted-foreground">Decisão sugerida pelo sistema:</p>
                <DecisionBadge decision={suggested} />
              </div>
            )}

            <div className="space-y-1.5">
              <Label>
                19. Ação de tratamento <span className="text-destructive">*</span>
              </Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {TREATMENT_ACTIONS.map((action) => {
                  const colors: Record<string, string> = {
                    Aceitar: "border-green-300 bg-green-50 text-green-700",
                    Monitorar: "border-blue-300 bg-blue-50 text-blue-700",
                    Mitigar: "border-orange-300 bg-orange-50 text-orange-700",
                    Escalonar: "border-red-300 bg-red-50 text-red-700",
                  };
                  return (
                    <button
                      key={action}
                      type="button"
                      onClick={() => set("treatmentAction", action)}
                      className={cn(
                        "py-2.5 px-4 rounded-lg border-2 text-sm font-medium transition-all",
                        form.treatmentAction === action
                          ? `${colors[action]} border-current shadow-sm`
                          : "border-border bg-background text-muted-foreground hover:border-primary/50"
                      )}
                    >
                      {action}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="actionPlanDescription">
                20. Descreva o plano de ação <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="actionPlanDescription"
                placeholder="Descreva o plano de ação claro e executável..."
                value={form.actionPlanDescription}
                onChange={(e) => set("actionPlanDescription", e.target.value)}
                required
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="actionPlanDeadline">21. Prazo de implementação</Label>
                <Input
                  id="actionPlanDeadline"
                  type="date"
                  value={form.actionPlanDeadline}
                  onChange={(e) => set("actionPlanDeadline", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="actionPlanResponsible">
                  22. Responsável <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="actionPlanResponsible"
                  placeholder="Nome do responsável"
                  value={form.actionPlanResponsible}
                  onChange={(e) => set("actionPlanResponsible", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>
                  23. Status das ações <span className="text-destructive">*</span>
                </Label>
                <Select value={form.actionPlanStatus} onValueChange={(v) => set("actionPlanStatus", v)} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    {ACTION_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Botões */}
        <div className="flex items-center justify-end gap-3 pb-8">
          <Button type="button" variant="outline" onClick={() => setLocation("/riscos")}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading} className="min-w-[140px]">
            <Save className="w-4 h-4 mr-2" />
            {isLoading ? "Salvando..." : isEdit ? "Atualizar Risco" : "Cadastrar Risco"}
          </Button>
        </div>
      </form>
    </AppLayout>
  );
}
