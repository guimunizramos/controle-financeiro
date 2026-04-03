import { useFinance } from "@/contexts/FinanceContext";
import { CashCard } from "@/components/CashCard";
import { CategoryProgress } from "@/components/CategoryProgress";
import { FixedExpenses } from "@/components/FixedExpenses";
import { InvoiceCard } from "@/components/InvoiceCard";
import { TransactionList } from "@/components/TransactionList";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function VisaoGeral() {
  const { cards, selectedCycle, setSelectedCycle, availableCycles } = useFinance();
  const ownerCards = [...new Set(cards.map((card) => card.owner))].map((owner) => cards.find((card) => card.owner === owner)!);

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-card px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-lg font-bold text-white">Visão Geral</h2>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-white">Ciclo/Mês</span>
          <Select value={selectedCycle} onValueChange={setSelectedCycle}>
            <SelectTrigger className="w-40 bg-secondary border-border text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              {availableCycles.map((cycle) => (
                <SelectItem key={cycle} value={cycle}>
                  {cycle}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <CashCard />
        {ownerCards.map((card) => (
          <InvoiceCard key={card.owner} card={card} />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <CategoryProgress />
        <TransactionList />
        <FixedExpenses />
      </div>
    </div>
  );
}
