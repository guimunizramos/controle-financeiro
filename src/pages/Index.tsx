import { useFinance } from "@/contexts/FinanceContext";
import { getDaysUntilClosing } from "@/lib/finance-data";
import { Activity, LayoutDashboard, List, Settings } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { VisaoGeral } from "@/components/tabs/VisaoGeral";
import { Lancamentos } from "@/components/tabs/Lancamentos";
import { Configuracoes } from "@/components/tabs/Configuracoes";

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

const Index = () => {
  const { cards, selectedCycle, setSelectedCycle, availableCycles } = useFinance();
  const guiCard = cards.find((c) => c.name === "Gui");
  const daysLeft = guiCard ? getDaysUntilClosing(guiCard) : null;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-primary">
              <Activity className="h-5 w-5 text-primary-foreground" />
            </div>
            <p className="text-xs text-muted-foreground">
              {getGreeting()}, Gui!
              {guiCard && daysLeft !== null && (
                <> · Cartão Gui fecha em <span className="text-primary font-medium">{daysLeft} dias</span></>
              )}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="min-w-40">
              <Select value={selectedCycle} onValueChange={setSelectedCycle}>
                <SelectTrigger className="h-8 text-xs bg-secondary/50 border-border">
                  <SelectValue placeholder="Selecionar ciclo" />
                </SelectTrigger>
                <SelectContent>
                  {availableCycles.map((cycle) => (
                    <SelectItem key={cycle} value={cycle}>
                      {cycle}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="text-mono text-xs text-muted-foreground">
              {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "short", year: "numeric" })}
            </div>
          </div>
        </div>
      </header>

      <main className="container max-w-6xl mx-auto px-4 py-6">
        <Tabs defaultValue="visao-geral" className="space-y-6">
          <TabsList className="bg-secondary/50 border border-border">
            <TabsTrigger value="visao-geral" className="gap-1.5 data-[state=active]:text-primary">
              <LayoutDashboard className="h-4 w-4" />
              Visão Geral
            </TabsTrigger>
            <TabsTrigger value="lancamentos" className="gap-1.5 data-[state=active]:text-primary">
              <List className="h-4 w-4" />
              Lançamentos
            </TabsTrigger>
            <TabsTrigger value="configuracoes" className="gap-1.5 data-[state=active]:text-primary">
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
          <TabsContent value="configuracoes">
            <Configuracoes />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
