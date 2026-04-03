import { useFinance } from "@/contexts/FinanceContext";
import { formatCurrency } from "@/lib/finance-data";
import { Wallet } from "lucide-react";

export function CashCard() {
  const { getAvailableCash, referenceIncome } = useFinance();
  const cash = getAvailableCash();
  const pct = ((cash / referenceIncome) * 100).toFixed(1);

  return (
    <div className="rounded-xl border border-glow bg-card p-6 glow-primary">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg gradient-primary">
          <Wallet className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Caixa Disponível</p>
          <p className="text-mono text-2xl font-bold text-primary">{formatCurrency(cash)}</p>
        </div>
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Receita de referência: {formatCurrency(referenceIncome)}</span>
        <span className="text-primary font-medium">{pct}% livre</span>
      </div>
    </div>
  );
}
