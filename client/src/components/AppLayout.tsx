import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  BarChart3,
  ChevronRight,
  ClipboardList,
  Download,
  LogOut,
  Menu,
  Plus,
  Shield,
  X,
} from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Separator } from "./ui/separator";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const navItems = [
  {
    label: "Dashboard",
    href: "/",
    icon: BarChart3,
    description: "Visão executiva",
  },
  {
    label: "Matriz de Riscos",
    href: "/riscos",
    icon: AlertTriangle,
    description: "Todos os riscos",
  },
  {
    label: "Plano de Ação",
    href: "/plano-de-acao",
    icon: ClipboardList,
    description: "Acompanhamento",
  },
];

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export default function AppLayout({ children, title, subtitle, actions }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [location] = useLocation();
  const { user, isAuthenticated, loading } = useAuth();
  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      window.location.href = getLoginUrl();
    },
    onError: () => toast.error("Erro ao sair"),
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Shield className="w-10 h-10 text-primary animate-pulse" />
          <p className="text-muted-foreground text-sm">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    window.location.href = getLoginUrl();
    return null;
  }

  const initials = user?.name
    ? user.name
        .split(" ")
        .slice(0, 2)
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "U";

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-sidebar-primary/20 flex items-center justify-center">
            <Shield className="w-5 h-5 text-sidebar-primary" />
          </div>
          <div>
            <p className="text-sidebar-foreground font-semibold text-sm leading-tight">
              Gestão de Riscos
            </p>
            <p className="text-sidebar-foreground/50 text-xs">Corporativos</p>
          </div>
        </div>
      </div>

      <Separator className="bg-sidebar-border" />

      {/* Navegação */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 group",
                isActive
                  ? "bg-sidebar-accent text-sidebar-foreground font-medium"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              )}
              onClick={() => setSidebarOpen(false)}
            >
              <Icon className={cn("w-4 h-4 shrink-0", isActive ? "text-sidebar-primary" : "")} />
              <div className="flex-1 min-w-0">
                <p className="truncate">{item.label}</p>
                <p className="text-xs text-sidebar-foreground/40 truncate">{item.description}</p>
              </div>
              {isActive && <ChevronRight className="w-3.5 h-3.5 text-sidebar-primary shrink-0" />}
            </Link>
          );
        })}
      </nav>

      <Separator className="bg-sidebar-border" />

      {/* Ação rápida */}
      <div className="px-3 py-3">
        <Link
          href="/riscos/novo"
          className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg bg-sidebar-primary/15 hover:bg-sidebar-primary/25 text-sidebar-primary text-sm font-medium transition-all"
          onClick={() => setSidebarOpen(false)}
        >
          <Plus className="w-4 h-4" />
          Novo Risco
        </Link>
      </div>

      <Separator className="bg-sidebar-border" />

      {/* Usuário */}
      <div className="px-3 py-4">
        <div className="flex items-center gap-3 px-2">
          <Avatar className="w-8 h-8">
            <AvatarFallback className="bg-sidebar-primary/20 text-sidebar-primary text-xs font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sidebar-foreground text-xs font-medium truncate">
              {user?.name ?? "Usuário"}
            </p>
            <p className="text-sidebar-foreground/40 text-xs truncate">
              {user?.role === "admin" ? "Administrador" : "Usuário"}
            </p>
          </div>
          <button
            onClick={() => logoutMutation.mutate()}
            className="text-sidebar-foreground/40 hover:text-sidebar-foreground transition-colors p-1 rounded"
            title="Sair"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar desktop */}
      <aside className="hidden lg:flex flex-col w-60 bg-sidebar shrink-0 fixed inset-y-0 left-0 z-30">
        <SidebarContent />
      </aside>

      {/* Sidebar mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <aside className="absolute left-0 top-0 bottom-0 w-60 bg-sidebar z-50">
            <button
              className="absolute top-4 right-4 text-sidebar-foreground/60 hover:text-sidebar-foreground"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-5 h-5" />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 lg:ml-60 min-h-screen flex flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <button
              className="lg:hidden text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex-1 min-w-0">
              {title && (
                <h1 className="text-lg font-semibold text-foreground truncate">{title}</h1>
              )}
              {subtitle && (
                <p className="text-sm text-muted-foreground truncate">{subtitle}</p>
              )}
            </div>
            {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 px-4 sm:px-6 lg:px-8 py-6">{children}</div>
      </main>
    </div>
  );
}
