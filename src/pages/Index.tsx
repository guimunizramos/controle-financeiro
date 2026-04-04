import { Activity, LayoutDashboard, List, Settings, WalletCards } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VisaoGeral } from "@/components/tabs/VisaoGeral";
import { Lancamentos } from "@/components/tabs/Lancamentos";
import { Configuracoes } from "@/components/tabs/Configuracoes";
import { ComprasParceladas } from "@/components/tabs/ComprasParceladas";
import { useFinance } from "@/contexts/FinanceContext";
import { PostsSection } from "@/components/posts/PostsSection";

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

const Index = () => {
  const { isLoading } = useFinance();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground text-sm">Carregando seus dados financeiros...</p>
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

      <main className="container max-w-6xl mx-auto px-4 py-6">
        <Tabs defaultValue="visao-geral" className="space-y-6">
          <TabsList className="w-full grid grid-cols-2 md:grid-cols-4 h-auto bg-primary border border-primary/70 p-1.5 rounded-xl">
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
          <TabsContent value="configuracoes">
            <Configuracoes />
          </TabsContent>
        </Tabs>
        <PostsSection />
      </main>
    </div>
  );
};

export default Index;
