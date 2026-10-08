import AppLayout from "@/components/AppLayout";
import { RiskBadge, StatusBadge, DecisionBadge } from "@/components/RiskBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { ACTION_STATUSES } from "../../../shared/riskCalculations";
import { useState } from "react";
import { useLocation } from "wouter";
import {
  Calendar,
  User,
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
  Eye,
  Pencil,
  Search,
  Filter,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

function getDaysUntilDeadline(deadline: string | Date | null): number | null {
  if (!deadline) return null;
  const d = new Date(deadline);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function DeadlineIndicator({ deadline, status }: { deadline: string | Date | null; status: string }) {
  const days = getDaysUntilDeadline(deadline);

  if (!deadline) return <span className="text-xs text-muted-foreground">Sem prazo</span>;

  const dateStr = new Date(deadline).toLocaleDateString("pt-BR");

  if (status === "Concluído") {
    return (
      <div className="flex items-center gap-1 text-green-600">
        <CheckCircle2 className="w-3.5 h-3.5" />
        <span className="text-xs font-medium">{dateStr}</span>
      </div>
    );
  }

  if (days === null) return null;

  if (days < 0) {
    return (
      <div className="flex items-center gap-1 text-red-600">
        <XCircle className="w-3.5 h-3.5" />
        <span className="text-xs font-medium">{dateStr}</span>
        <span className="text-xs">({Math.abs(days)}d atrasado)</span>
      </div>
    );
  }

  if (days <= 7) {
    return (
      <div className="flex items-center gap-1 text-orange-600">
        <AlertTriangle className="w-3.5 h-3.5" />
        <span className="text-xs font-medium">{dateStr}</span>
        <span className="text-xs">({days}d restantes)</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 text-muted-foreground">
      <Calendar className="w-3.5 h-3.5" />
      <span className="text-xs">{dateStr}</span>
      <span className="text-xs text-muted-foreground/60">({days}d)</span>
    </div>
  );
}

export default function ActionPlan() {
  const [, setLocation] = useLocation();
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [responsibleFilter, setResponsibleFilter] = useState("");
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const utils = trpc.useUtils();

  const { data, isLoading } = trpc.risks.list.useQuery({
    search: search || undefined,
    actionPlanStatus: statusFilter || undefined,
    pageSize: 500,
  });

  // Filtro por responsável aplicado no frontend após a query
  const allRisks = data?.data ?? [];
  const risks = responsibleFilter
    ? allRisks.filter((r) =>
        r.actionPlanResponsible.toLowerCase().includes(responsibleFilter.toLowerCase())
      )
    : allRisks;

  const updateStatusMutation = trpc.risks.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Status atualizado com sucesso");
      utils.risks.list.invalidate();
      utils.risks.dashboard.invalidate();
      setUpdatingId(null);
    },
    onError: (e) => toast.error(`Erro: ${e.message}`),
  });

  // Estatísticas
  const stats = {
    total: risks.length,
    pending: risks.filter((r) => r.actionPlanStatus === "Pendente").length,
    inProgress: risks.filter((r) => r.actionPlanStatus === "Em andamento").length,
    concluded: risks.filter((r) => r.actionPlanStatus === "Concluído").length,
    overdue: risks.filter((r) => r.actionPlanStatus === "Atrasado").length,
  };

  const hasFilters = statusFilter || search || responsibleFilter;

  return (
    <AppLayout
      title="Plano de Ação"
      subtitle="Acompanhamento de prazos, responsáveis e status"
    >
      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
        {[
          { label: "Pendente", value: stats.pending, icon: Clock, color: "bg-slate-100 text-slate-600", filter: "Pendente" },
          { label: "Em andamento", value: stats.inProgress, icon: TrendingUp, color: "bg-blue-100 text-blue-600", filter: "Em andamento" },
          { label: "Concluído", value: stats.concluded, icon: CheckCircle2, color: "bg-green-100 text-green-600", filter: "Concluído" },
          { label: "Atrasado", value: stats.overdue, icon: XCircle, color: "bg-red-100 text-red-600", filter: "Atrasado" },
        ].map(({ label, value, icon: Icon, color, filter }) => (
          <button
            key={label}
            onClick={() => setStatusFilter(statusFilter === filter ? "" : filter)}
            className={cn(
              "text-left transition-all",
              statusFilter === filter && "ring-2 ring-primary ring-offset-2 rounded-xl"
            )}
          >
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="text-2xl font-bold mt-0.5">{value}</p>
                  </div>
                  <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", color)}>
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </button>
        ))}
      </div>

      {/* Filtros */}
      <Card className="mb-5">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-3 flex-wrap">
            <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por risco ou responsável..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="relative min-w-[160px]">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Filtrar por responsável..."
                value={responsibleFilter}
                onChange={(e) => setResponsibleFilter(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v === "all" ? "" : v)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                {ACTION_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {hasFilters && (
              <button
                onClick={() => { setStatusFilter(""); setSearch(""); setResponsibleFilter(""); }}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" />
                Limpar
              </button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Lista de planos */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Carregando...</div>
      ) : risks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
          <ClipboardList className="w-10 h-10 opacity-30" />
          <p className="font-medium">Nenhum plano de ação encontrado</p>
        </div>
      ) : (
        <div className="space-y-3">
          {risks.map((risk) => {
            const isUpdating = updatingId === risk.id;
            return (
              <Card
                key={risk.id}
                className={cn(
                  "transition-all hover:shadow-md",
                  risk.actionPlanStatus === "Atrasado" && "border-red-200",
                  risk.actionPlanStatus === "Concluído" && "opacity-75"
                )}
              >
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start gap-4 flex-wrap">
                    {/* Info principal */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-mono text-xs text-muted-foreground">{risk.riskCode}</span>
                        <RiskBadge level={risk.residualRiskLevel} size="sm" />
                        <DecisionBadge decision={risk.treatmentAction} />
                      </div>
                      <p className="text-sm font-medium text-foreground line-clamp-1 mb-1">
                        {risk.riskDescription}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {risk.actionPlanDescription}
                      </p>
                    </div>

                    {/* Meta info */}
                    <div className="flex flex-col gap-2 shrink-0 min-w-[160px]">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        <span className="text-xs text-foreground truncate max-w-[140px]">
                          {risk.actionPlanResponsible}
                        </span>
                      </div>
                      <DeadlineIndicator
                        deadline={risk.actionPlanDeadline}
                        status={risk.actionPlanStatus}
                      />
                    </div>

                    {/* Status e ações */}
                    <div className="flex items-center gap-2 shrink-0">
                      {isUpdating ? (
                        <Select
                          value={risk.actionPlanStatus}
                          onValueChange={(v) => {
                            updateStatusMutation.mutate({
                              id: risk.id,
                              actionPlanStatus: v as any,
                            });
                          }}
                          open
                          onOpenChange={(open) => !open && setUpdatingId(null)}
                        >
                          <SelectTrigger className="w-[150px] h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ACTION_STATUSES.map((s) => (
                              <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <button onClick={() => setUpdatingId(risk.id)} title="Alterar status">
                          <StatusBadge status={risk.actionPlanStatus} className="cursor-pointer hover:opacity-80" />
                        </button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => setLocation(`/riscos/${risk.id}`)}
                        title="Visualizar"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => setLocation(`/riscos/${risk.id}/editar`)}
                        title="Editar"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </AppLayout>
  );
}

// Importação necessária para o ícone
function TrendingUp({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  );
}

function ClipboardList({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <line x1="12" y1="11" x2="16" y2="11" />
      <line x1="12" y1="16" x2="16" y2="16" />
      <line x1="8" y1="11" x2="8.01" y2="11" />
      <line x1="8" y1="16" x2="8.01" y2="16" />
    </svg>
  );
}
