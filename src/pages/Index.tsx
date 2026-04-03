import { CashCard } from "@/components/CashCard";
import { CategoryProgress } from "@/components/CategoryProgress";
import { FixedExpenses } from "@/components/FixedExpenses";
import { InvoiceCard } from "@/components/InvoiceCard";
import { TransactionList } from "@/components/TransactionList";
import { cards, getDaysUntilClosing } from "@/lib/finance-data";
import { Activity } from "lucide-react";

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

const Index = () => {
  const guiCard = cards.find((c) => c.name === "Gui")!;
  const daysLeft = getDaysUntilClosing(guiCard);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-primary">
              <Activity className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">Cycle Finance</h1>
              <p className="text-xs text-muted-foreground">
                {getGreeting()}, Gui! · Cartão Gui fecha em <span className="text-primary font-medium">{daysLeft} dias</span>
              </p>
            </div>
          </div>
          <div className="text-mono text-xs text-muted-foreground">
            {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "short", year: "numeric" })}
          </div>
        </div>
      </header>

      {/* Dashboard */}
      <main className="container max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Top row: Cash + Invoices */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <CashCard />
          {cards.map((card) => (
            <InvoiceCard key={card.name} card={card} />
          ))}
        </div>

        {/* Bottom row: Categories + Transactions + Fixed */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <CategoryProgress />
          <TransactionList />
          <FixedExpenses />
        </div>
      </main>
    </div>
  );
};

export default Index;
