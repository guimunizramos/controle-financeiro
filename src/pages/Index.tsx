import { Activity, LayoutDashboard, List, Loader2, Settings, ShieldCheck, WalletCards } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VisaoGeral } from "@/components/tabs/VisaoGeral";
import { Lancamentos } from "@/components/tabs/Lancamentos";
import { Configuracoes } from "@/components/tabs/Configuracoes";
import { Previsibilidade } from "@/components/tabs/Previsibilidade";
import { ComprasParceladas } from "@/components/tabs/ComprasParceladas";
import { useFinance } from "@/contexts/FinanceContext";

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

const countdownItems = [
  { value: "07", label: "dias" },
  { value: "14", label: "horas" },
  { value: "32", label: "min" },
  { value: "18", label: "seg" },
];

const Index = () => {
  const { isLoading } = useFinance();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-2 text-green-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          <p className="text-sm font-medium">Carregando seus dados financeiros...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-primary">
              <Activity className="h-5 w-5 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">{getGreeting()}, Gui!</h1>
          </div>
          <div className="text-mono text-xs text-muted-foreground">
            {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "short", year: "numeric" })}
          </div>
        </div>
      </header>

      <section className="mobile-hero-parallax relative overflow-hidden border-b border-primary/20">
        <div className="container max-w-6xl mx-auto px-4 py-10 md:py-14">
          <div className="relative z-[1] max-w-2xl space-y-3">
            <span className="inline-flex rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-primary">
              Controle financeiro
            </span>
            <h2 className="text-3xl font-bold tracking-tight text-white md:text-5xl">
              Organize seus ciclos, cartões e metas em um só lugar.
            </h2>
            <p className="text-sm leading-6 text-muted-foreground md:text-base">
              Acompanhe entradas, despesas e previsões com uma visão clara para decidir melhor no dia a dia.
            </p>
          </div>
        </div>
      </section>

      <section className="border-b border-primary/20 bg-primary/10">
        <div className="container max-w-6xl mx-auto px-4 py-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <p className="text-sm font-semibold text-white md:text-base">Próxima revisão financeira começa em:</p>
          <div className="flex flex-wrap items-center gap-3" aria-label="Contagem regressiva para a próxima revisão financeira">
            {countdownItems.map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                <span className="flex h-10 min-w-12 items-center justify-center rounded-lg border border-primary/40 bg-background px-3 text-lg font-bold text-primary shadow-[var(--glow-primary)]">
                  {item.value}
                </span>
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <main className="container max-w-6xl mx-auto px-4 py-6">
        <Tabs defaultValue="visao-geral" className="space-y-6">
          <TabsList className="w-full grid grid-cols-2 md:grid-cols-5 h-auto bg-primary border border-primary/70 p-1.5 rounded-xl">
            <TabsTrigger value="visao-geral" className="gap-1.5 text-primary-foreground/80 data-[state=active]:bg-primary-foreground/15 data-[state=active]:text-white">
              <LayoutDashboard className="h-4 w-4" />
              Visão Geral
            </TabsTrigger>
            <TabsTrigger value="lancamentos" className="gap-1.5 text-primary-foreground/80 data-[state=active]:bg-primary-foreground/15 data-[state=active]:text-white">
              <List className="h-4 w-4" />
              Lançamentos
            </TabsTrigger>
            <TabsTrigger value="compras-parceladas" className="gap-1.5 text-primary-foreground/80 data-[state=active]:bg-primary-foreground/15 data-[state=active]:text-white">
              <WalletCards className="h-4 w-4" />
              Compras Parceladas
            </TabsTrigger>
            <TabsTrigger value="previsibilidade" className="gap-1.5 text-primary-foreground/80 data-[state=active]:bg-primary-foreground/15 data-[state=active]:text-white">
              <ShieldCheck className="h-4 w-4" />
              Previsibilidade
            </TabsTrigger>
            <TabsTrigger value="configuracoes" className="gap-1.5 text-primary-foreground/80 data-[state=active]:bg-primary-foreground/15 data-[state=active]:text-white">
              <Settings className="h-4 w-4" />
              Configurações
            </TabsTrigger>
          </TabsList>

          <TabsContent value="visao-geral">
            <VisaoGeral />
          </TabsContent>
          <TabsContent value="lancamentos">
            <Lancamentos />
          </TabsContent>
          <TabsContent value="compras-parceladas">
            <ComprasParceladas />
          </TabsContent>
          <TabsContent value="previsibilidade">
            <Previsibilidade />
          </TabsContent>
          <TabsContent value="configuracoes">
            <Configuracoes />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
