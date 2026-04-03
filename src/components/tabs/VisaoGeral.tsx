import { useFinance } from "@/contexts/FinanceContext";
import { CashCard } from "@/components/CashCard";
import { CategoryProgress } from "@/components/CategoryProgress";
import { FixedExpenses } from "@/components/FixedExpenses";
import { InvoiceCard } from "@/components/InvoiceCard";
import { TransactionList } from "@/components/TransactionList";
import { InstallmentPurchaseCards } from "@/components/InstallmentPurchaseCards";

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

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Compras Parceladas</h3>
          <span className="text-xs text-primary">Cards individuais</span>
        </div>
        <InstallmentPurchaseCards />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <CategoryProgress />
        <TransactionList />
        <FixedExpenses />
      </div>
    </div>
  );
}
