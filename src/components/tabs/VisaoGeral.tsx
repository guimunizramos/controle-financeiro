import { useFinance } from "@/contexts/FinanceContext";
import { CashCard } from "@/components/CashCard";
import { CategoryProgress } from "@/components/CategoryProgress";
import { FixedExpenses } from "@/components/FixedExpenses";
import { InvoiceCard } from "@/components/InvoiceCard";
import { TransactionList } from "@/components/TransactionList";

export function VisaoGeral() {
  const { cards } = useFinance();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <CashCard />
        {cards.map((card) => (
          <InvoiceCard key={card.name} card={card} />
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
