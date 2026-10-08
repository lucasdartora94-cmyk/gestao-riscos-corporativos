import AppLayout from "@/components/AppLayout";
import { RiskBadge, StatusBadge, DecisionBadge } from "@/components/RiskBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import {
  AlertTriangle,
  TrendingUp,
  CheckCircle2,
  Clock,
  XCircle,
  Plus,
  ArrowRight,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { cn } from "@/lib/utils";

// ─── Heatmap 5×5 ─────────────────────────────────────────────────────────────

const IMPACT_LABELS = ["Muito Baixo", "Baixo", "Moderado", "Alto", "Muito Alto"];
const PROB_LABELS = ["Improvável", "Rara", "Possível", "Provável", "Prat. Certa"];

function getHeatmapClass(impact: number, prob: number): string {
  const score = (impact + 1) * (prob + 1);
  if (score <= 4) return "heatmap-baixo";
  if (score <= 9) return "heatmap-medio";
  if (score <= 14) return "heatmap-alto";
  if (score <= 19) return "heatmap-muito-alto";
  return "heatmap-critico";
}

function getRiskLevelForScore(impact: number, prob: number): string {
  const score = (impact + 1) * (prob + 1);
  if (score <= 4) return "Baixo";
  if (score <= 9) return "Médio";
  if (score <= 14) return "Alto";
  if (score <= 19) return "Muito Alto";
  return "Crítico";
}

function Heatmap({ data, title }: { data: number[][]; title: string }) {
  return (
    <div>
      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">{title}</h4>
      <div className="overflow-x-auto">
        <div className="min-w-[340px]">
          {/* Eixo X - Impacto */}
          <div className="flex mb-1 ml-16">
            {IMPACT_LABELS.map((label, i) => (
              <div key={i} className="flex-1 text-center text-xs text-muted-foreground truncate px-0.5">
                {i + 1}
              </div>
            ))}
          </div>
          <div className="flex mb-1 ml-16">
            <div className="flex-1 text-center text-xs text-muted-foreground font-medium col-span-5">
              ← Impacto →
            </div>
          </div>

          {/* Grid */}
          {[4, 3, 2, 1, 0].map((probIdx) => (
            <div key={probIdx} className="flex items-center mb-1">
              <div className="w-16 shrink-0 text-right pr-2">
                <span className="text-xs text-muted-foreground">{probIdx + 1}</span>
              </div>
              {[0, 1, 2, 3, 4].map((impactIdx) => {
                const count = data[probIdx]?.[impactIdx] ?? 0;
                return (
                  <div
                    key={impactIdx}
                    className={cn(
                      "flex-1 h-10 flex items-center justify-center rounded-sm mx-0.5 text-sm font-bold transition-all",
                      getHeatmapClass(impactIdx, probIdx)
                    )}
                    title={`Impacto ${impactIdx + 1} × Prob ${probIdx + 1} = ${(impactIdx + 1) * (probIdx + 1)} (${getRiskLevelForScore(impactIdx, probIdx)})`}
                  >
                    {count > 0 ? count : ""}
                  </div>
                );
              })}
            </div>
          ))}

          {/* Eixo Y label */}
          <div className="flex ml-16 mt-1">
            <div className="flex-1 text-center text-xs text-muted-foreground font-medium">
              ↑ Probabilidade ↑
            </div>
          </div>
        </div>
      </div>

      {/* Legenda */}
      <div className="flex gap-2 flex-wrap mt-3">
        {[
          { label: "Baixo", cls: "heatmap-baixo" },
          { label: "Médio", cls: "heatmap-medio" },
          { label: "Alto", cls: "heatmap-alto" },
          { label: "Muito Alto", cls: "heatmap-muito-alto" },
          { label: "Crítico", cls: "heatmap-critico" },
        ].map(({ label, cls }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className={cn("w-3 h-3 rounded-sm", cls)} />
            <span className="text-xs text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
}: {
  title: string;
  value: number;
  subtitle?: string;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <Card>
      <CardContent className="pt-5 pb-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{title}</p>
            <p className="text-3xl font-bold text-foreground mt-1">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
          </div>
          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", color)}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Cores dos gráficos ───────────────────────────────────────────────────────

const CATEGORY_COLORS = [
  "#3b82f6", "#8b5cf6", "#ec4899", "#f97316", "#eab308", "#22c55e",
];

const LEVEL_COLORS: Record<string, string> = {
  Baixo: "#22c55e",
  Médio: "#eab308",
  Alto: "#f97316",
  "Muito Alto": "#ef4444",
  Crítico: "#7c3aed",
};

const STATUS_COLORS: Record<string, string> = {
  Pendente: "#94a3b8",
  "Em andamento": "#3b82f6",
  Concluído: "#22c55e",
  Atrasado: "#ef4444",
};

const DECISION_COLORS: Record<string, string> = {
  Aceitar: "#22c55e",
  Monitorar: "#3b82f6",
  Mitigar: "#f97316",
  Escalonar: "#ef4444",
};

// ─── Dashboard ────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { data, isLoading } = trpc.risks.dashboard.useQuery();

  if (isLoading) {
    return (
      <AppLayout title="Dashboard" subtitle="Visão executiva de riscos">
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          Carregando dashboard...
        </div>
      </AppLayout>
    );
  }

  const isEmpty = !data || data.total === 0;

  const categoryData = data
    ? Object.entries(data.byCategory).map(([name, value]) => ({ name: name.replace("Risco ", ""), value }))
    : [];

  const levelData = data
    ? ["Baixo", "Médio", "Alto", "Muito Alto", "Crítico"]
        .filter((l) => (data.byResidualLevel[l] ?? 0) > 0)
        .map((name) => ({ name, value: data.byResidualLevel[name] ?? 0 }))
    : [];

  const statusData = data
    ? Object.entries(data.byStatus).map(([name, value]) => ({ name, value }))
    : [];

  const decisionData = data
    ? Object.entries(data.byDecision).map(([name, value]) => ({ name, value }))
    : [];

  return (
    <AppLayout
      title="Dashboard Executivo"
      subtitle="Visão consolidada do portfólio de riscos"
      actions={
        <Button size="sm" onClick={() => setLocation("/riscos/novo")}>
          <Plus className="w-4 h-4 mr-1.5" />
          Novo Risco
        </Button>
      }
    >
      {isEmpty ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-muted-foreground" />
          </div>
          <div className="text-center">
            <h3 className="font-semibold text-foreground">Nenhum risco cadastrado</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Cadastre o primeiro risco para visualizar o dashboard
            </p>
          </div>
          <Button onClick={() => setLocation("/riscos/novo")}>
            <Plus className="w-4 h-4 mr-2" />
            Cadastrar Primeiro Risco
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            <KpiCard
              title="Total de Riscos"
              value={data!.total}
              subtitle="na matriz"
              icon={AlertTriangle}
              color="bg-blue-100 text-blue-600"
            />
            <KpiCard
              title="Críticos"
              value={data!.critical}
              subtitle="risco residual"
              icon={XCircle}
              color="bg-purple-100 text-purple-600"
            />
            <KpiCard
              title="Muito Altos"
              value={data!.veryHigh}
              subtitle="risco residual"
              icon={TrendingUp}
              color="bg-red-100 text-red-600"
            />
            <KpiCard
              title="Em Tratamento"
              value={data!.inTreatment}
              subtitle="planos ativos"
              icon={Clock}
              color="bg-orange-100 text-orange-600"
            />
            <KpiCard
              title="Concluídos"
              value={data!.concluded}
              subtitle="planos encerrados"
              icon={CheckCircle2}
              color="bg-green-100 text-green-600"
            />
            <KpiCard
              title="Atrasados"
              value={data!.overdue}
              subtitle="fora do prazo"
              icon={XCircle}
              color="bg-red-100 text-red-600"
            />
          </div>

          {/* Heatmaps */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Heatmap — Risco Inerente</CardTitle>
                <p className="text-xs text-muted-foreground">Distribuição antes dos controles</p>
              </CardHeader>
              <CardContent>
                <Heatmap data={data!.heatmapInherent} title="" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Heatmap — Risco Residual</CardTitle>
                <p className="text-xs text-muted-foreground">Distribuição após os controles</p>
              </CardHeader>
              <CardContent>
                <Heatmap data={data!.heatmapResidual} title="" />
              </CardContent>
            </Card>
          </div>

          {/* Gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Por categoria */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Distribuição por Categoria</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={categoryData} layout="vertical" margin={{ left: 0, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={100} />
                    <Tooltip
                      contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }}
                    />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                      {categoryData.map((_, i) => (
                        <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Por nível residual */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Nível de Risco Residual</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={levelData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {levelData.map((entry, i) => (
                        <Cell key={i} fill={LEVEL_COLORS[entry.name] ?? "#94a3b8"} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }}
                    />
                    <Legend
                      iconType="circle"
                      iconSize={8}
                      formatter={(value) => <span style={{ fontSize: 11 }}>{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Por status */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Status do Plano de Ação</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {statusData.map((entry, i) => (
                        <Cell key={i} fill={STATUS_COLORS[entry.name] ?? "#94a3b8"} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }}
                    />
                    <Legend
                      iconType="circle"
                      iconSize={8}
                      formatter={(value) => <span style={{ fontSize: 11 }}>{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Por decisão */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Decisão de Tratamento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 mt-2">
                  {decisionData.map(({ name, value }) => {
                    const pct = data!.total > 0 ? Math.round((value / data!.total) * 100) : 0;
                    return (
                      <div key={name}>
                        <div className="flex items-center justify-between mb-1">
                          <DecisionBadge decision={name} />
                          <span className="text-sm font-semibold">{value} <span className="text-muted-foreground font-normal text-xs">({pct}%)</span></span>
                        </div>
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${pct}%`,
                              backgroundColor: DECISION_COLORS[name] ?? "#94a3b8",
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick actions */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Acesse a matriz completa para gerenciar todos os riscos
            </p>
            <Button variant="outline" size="sm" onClick={() => setLocation("/riscos")}>
              Ver Matriz Completa
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
