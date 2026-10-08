import { getLoginUrl } from "@/const";
import { Shield, Lock, BarChart3, AlertTriangle, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import { useEffect } from "react";
import { useLocation } from "wouter";

export default function Login() {
  const { isAuthenticated, loading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      setLocation("/");
    }
  }, [isAuthenticated, loading, setLocation]);

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-sidebar p-12">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sidebar-primary/20 flex items-center justify-center">
            <Shield className="w-6 h-6 text-sidebar-primary" />
          </div>
          <div>
            <p className="text-sidebar-foreground font-bold text-base">Gestão de Riscos</p>
            <p className="text-sidebar-foreground/50 text-xs">Corporativos</p>
          </div>
        </div>

        <div className="space-y-8">
          <div>
            <h2 className="text-3xl font-bold text-sidebar-foreground leading-tight">
              Controle total sobre os riscos da sua organização
            </h2>
            <p className="mt-4 text-sidebar-foreground/60 text-base leading-relaxed">
              Mapeie, avalie, priorize e trate riscos corporativos com metodologia estruturada e visão executiva em tempo real.
            </p>
          </div>

          <div className="space-y-4">
            {[
              { icon: BarChart3, text: "Dashboard executivo com heatmaps e indicadores" },
              { icon: AlertTriangle, text: "Matriz de riscos com 23 campos metodológicos" },
              { icon: ClipboardList, text: "Plano de ação com prazos e responsáveis" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-sidebar-primary/15 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-sidebar-primary" />
                </div>
                <p className="text-sidebar-foreground/70 text-sm">{text}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-sidebar-foreground/30 text-xs">
          © 2025 Gestão de Riscos Corporativos
        </p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-sm space-y-8">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <Shield className="w-8 h-8 text-primary" />
            <div>
              <p className="font-bold text-foreground">Gestão de Riscos</p>
              <p className="text-muted-foreground text-xs">Corporativos</p>
            </div>
          </div>

          <div>
            <h1 className="text-2xl font-bold text-foreground">Bem-vindo</h1>
            <p className="mt-2 text-muted-foreground text-sm">
              Acesse sua conta para gerenciar os riscos corporativos.
            </p>
          </div>

          <div className="space-y-4">
            <Button asChild className="w-full h-11 text-sm font-medium" size="lg">
              <a href={getLoginUrl()}>
                <Lock className="w-4 h-4 mr-2" />
                Entrar com Manus
              </a>
            </Button>
          </div>

          <p className="text-center text-xs text-muted-foreground">
            Acesso seguro via autenticação OAuth
          </p>
        </div>
      </div>
    </div>
  );
}
