import { cn } from "@/lib/utils";

interface RiskBadgeProps {
  level: string;
  className?: string;
  size?: "sm" | "md";
}

export function RiskBadge({ level, className, size = "md" }: RiskBadgeProps) {
  const sizeClass = size === "sm" ? "text-xs px-2 py-0.5" : "text-xs px-2.5 py-1";

  const colorClass = {
    Baixo: "risk-badge-baixo",
    Médio: "risk-badge-medio",
    Alto: "risk-badge-alto",
    "Muito Alto": "risk-badge-muito-alto",
    Crítico: "risk-badge-critico",
  }[level] ?? "bg-gray-100 text-gray-700 border border-gray-200";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-semibold tracking-wide",
        sizeClass,
        colorClass,
        className
      )}
    >
      {level}
    </span>
  );
}

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const colorClass = {
    Pendente: "status-badge-pendente",
    "Em andamento": "status-badge-andamento",
    Concluído: "status-badge-concluido",
    Atrasado: "status-badge-atrasado",
  }[status] ?? "bg-gray-100 text-gray-700 border border-gray-200";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full text-xs font-semibold px-2.5 py-1 tracking-wide",
        colorClass,
        className
      )}
    >
      {status}
    </span>
  );
}

interface DecisionBadgeProps {
  decision: string;
  className?: string;
}

export function DecisionBadge({ decision, className }: DecisionBadgeProps) {
  const colorClass = {
    Aceitar: "decision-aceitar",
    Monitorar: "decision-monitorar",
    Mitigar: "decision-mitigar",
    Escalonar: "decision-escalonar",
  }[decision] ?? "bg-gray-100 text-gray-700 border border-gray-200";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full text-xs font-semibold px-2.5 py-1 tracking-wide",
        colorClass,
        className
      )}
    >
      {decision}
    </span>
  );
}
