import { useFinance } from "@/contexts/FinanceContext";
import { formatCurrency, getCurrentCycle } from "@/lib/finance-data";
import { ArrowDownLeft } from "lucide-react";

export function TransactionList() {
  const { transactions } = useFinance();
  const cycle = getCurrentCycle();
  const currentTx = transactions
    .filter((t) => t.cycle === cycle)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="rounded-xl border bg-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Lançamentos · {cycle}</h3>
        <span className="text-xs text-muted-foreground">{currentTx.length} itens</span>
      </div>
      <div className="space-y-1">
        {currentTx.map((tx, i) => (
          <div key={i} className="flex items-center justify-between py-2.5 border-b border-border/50 last:border-0">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary">
                <ArrowDownLeft className="h-4 w-4 text-destructive" />
              </div>
              <div>
                <p className="text-sm font-medium">{tx.description}</p>
                <p className="text-xs text-muted-foreground">{tx.card} · {tx.category} · {new Date(tx.date).toLocaleDateString("pt-BR")}</p>
              </div>
            </div>
            <span className="text-mono text-sm font-medium text-destructive">
              -{formatCurrency(tx.amount)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
