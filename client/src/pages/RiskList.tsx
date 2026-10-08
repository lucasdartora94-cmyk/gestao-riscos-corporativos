import AppLayout from "@/components/AppLayout";
import { RiskBadge, StatusBadge, DecisionBadge } from "@/components/RiskBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { RISK_CATEGORIES, ACTION_STATUSES } from "../../../shared/riskCalculations";
import { useState } from "react";
import { useLocation } from "wouter";
import {
  Plus,
  Search,
  Filter,
  Eye,
  Pencil,
  Trash2,
  Download,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const RISK_LEVELS = ["Baixo", "Médio", "Alto", "Muito Alto", "Crítico"];

export default function RiskList() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [macroprocessCode, setMacroprocessCode] = useState("");
  const [riskCategory, setRiskCategory] = useState("");
  const [residualRiskLevel, setResidualRiskLevel] = useState("");
  const [actionPlanStatus, setActionPlanStatus] = useState("");
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [exporting, setExporting] = useState(false);

  const utils = trpc.useUtils();

  const { data, isLoading } = trpc.risks.list.useQuery({
    search: search || undefined,
    macroprocessCode: macroprocessCode || undefined,
    riskCategory: riskCategory || undefined,
    residualRiskLevel: residualRiskLevel || undefined,
    actionPlanStatus: actionPlanStatus || undefined,
    page,
    pageSize: 15,
  });

  const deleteMutation = trpc.risks.delete.useMutation({
    onSuccess: () => {
      toast.success("Risco excluído com sucesso");
      utils.risks.list.invalidate();
      utils.risks.dashboard.invalidate();
      setDeleteId(null);
    },
    onError: (e) => toast.error(`Erro: ${e.message}`),
  });

  const exportMutation = trpc.risks.exportExcel.useMutation({
    onSuccess: (data) => {
      const link = document.createElement("a");
      link.href = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${data.base64}`;
      link.download = data.filename;
      link.click();
      toast.success("Exportação concluída!");
      setExporting(false);
    },
    onError: (e) => {
      toast.error(`Erro na exportação: ${e.message}`);
      setExporting(false);
    },
  });

  const handleExport = () => {
    setExporting(true);
    exportMutation.mutate({
      riskCategory: riskCategory || undefined,
      actionPlanStatus: actionPlanStatus || undefined,
    });
  };

  const hasFilters = search || macroprocessCode || riskCategory || residualRiskLevel || actionPlanStatus;

  const clearFilters = () => {
    setSearch("");
    setMacroprocessCode("");
    setRiskCategory("");
    setResidualRiskLevel("");
    setActionPlanStatus("");
    setPage(1);
  };

  const totalPages = data ? Math.ceil(data.total / 15) : 1;

  return (
    <AppLayout
      title="Matriz de Riscos"
      subtitle={data ? `${data.total} risco(s) encontrado(s)` : "Carregando..."}
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport} disabled={exporting}>
            <Download className="w-4 h-4 mr-1.5" />
            {exporting ? "Exportando..." : "Exportar Excel"}
          </Button>
          <Button size="sm" onClick={() => setLocation("/riscos/novo")}>
            <Plus className="w-4 h-4 mr-1.5" />
            Novo Risco
          </Button>
        </div>
      }
    >
      {/* Filtros */}
      <Card className="mb-5">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">Filtros</span>
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="ml-auto flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-3 h-3" />
                Limpar filtros
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="relative lg:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por descrição, código..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pl-9"
              />
            </div>
            <Input
              placeholder="Macroprocesso"
              value={macroprocessCode}
              onChange={(e) => { setMacroprocessCode(e.target.value); setPage(1); }}
            />
            <Select value={riskCategory} onValueChange={(v) => { setRiskCategory(v === "all" ? "" : v); setPage(1); }}>
              <SelectTrigger>
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
                {RISK_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={actionPlanStatus} onValueChange={(v) => { setActionPlanStatus(v === "all" ? "" : v); setPage(1); }}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                {ACTION_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="mt-3 flex gap-2 flex-wrap">
            {RISK_LEVELS.map((level) => (
              <button
                key={level}
                onClick={() => { setResidualRiskLevel(residualRiskLevel === level ? "" : level); setPage(1); }}
                className="transition-all"
              >
                <RiskBadge
                  level={level}
                  size="sm"
                  className={residualRiskLevel === level ? "ring-2 ring-offset-1 ring-current" : "opacity-60 hover:opacity-100"}
                />
              </button>
            ))}
            {residualRiskLevel && (
              <span className="text-xs text-muted-foreground self-center">← clique para remover filtro</span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabela */}
      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[120px]">Código</TableHead>
                <TableHead>Risco</TableHead>
                <TableHead className="w-[160px]">Categoria</TableHead>
                <TableHead className="w-[100px] text-center">Inerente</TableHead>
                <TableHead className="w-[100px] text-center">Residual</TableHead>
                <TableHead className="w-[120px]">Decisão</TableHead>
                <TableHead className="w-[120px]">Status</TableHead>
                <TableHead className="w-[140px]">Responsável</TableHead>
                <TableHead className="w-[100px] text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                    Carregando riscos...
                  </TableCell>
                </TableRow>
              ) : !data?.data.length ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Search className="w-8 h-8 opacity-30" />
                      <p className="font-medium">Nenhum risco encontrado</p>
                      <p className="text-sm">
                        {hasFilters ? "Tente ajustar os filtros" : "Cadastre o primeiro risco"}
                      </p>
                      {!hasFilters && (
                        <Button size="sm" className="mt-2" onClick={() => setLocation("/riscos/novo")}>
                          <Plus className="w-4 h-4 mr-1.5" />
                          Novo Risco
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                data.data.map((risk) => (
                  <TableRow key={risk.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell>
                      <div>
                        <p className="font-mono text-xs font-medium text-foreground">{risk.riskCode}</p>
                        <p className="font-mono text-xs text-muted-foreground">{risk.macroprocessCode}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm font-medium text-foreground line-clamp-2 max-w-[280px]">
                        {risk.riskDescription}
                      </p>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground">{risk.riskCategory}</span>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-sm font-bold">{risk.inherentRisk}</span>
                        <RiskBadge level={risk.inherentRiskLevel} size="sm" />
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-sm font-bold">{risk.residualRisk}</span>
                        <RiskBadge level={risk.residualRiskLevel} size="sm" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <DecisionBadge decision={risk.suggestedDecision} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={risk.actionPlanStatus} />
                    </TableCell>
                    <TableCell>
                      <p className="text-xs text-muted-foreground truncate max-w-[120px]">
                        {risk.actionPlanResponsible}
                      </p>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
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
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => setDeleteId(risk.id)}
                          title="Excluir"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Paginação */}
        {data && data.total > 15 && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <p className="text-xs text-muted-foreground">
              Página {page} de {totalPages} — {data.total} registros
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Dialog de confirmação de exclusão */}
      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir risco</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este risco? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteId && deleteMutation.mutate({ id: deleteId })}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
