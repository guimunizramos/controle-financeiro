import { useFinance } from "@/contexts/FinanceContext";
import { formatCurrency } from "@/lib/finance-data";
import { Wallet } from "lucide-react";

export function CashCard() {
  const { getAvailableCash, referenceIncome } = useFinance();
  const cash = getAvailableCash();
  const pctValue = referenceIncome > 0 ? (cash / referenceIncome) * 100 : 0;
  const pct = pctValue.toFixed(1);
  const cashStatus = (() => {
    if (cash < 0) return { label: "NEGATIVO", className: "bg-destructive/15 text-destructive" };
    if (pctValue <= 5) return { label: "CRÍTICO", className: "bg-destructive/15 text-destructive" };
    if (pctValue <= 15) return { label: "ALERTA", className: "bg-warning/15 text-warning" };
    if (pctValue <= 30) return { label: "ATENÇÃO", className: "bg-warning/15 text-warning" };
    if (pctValue <= 50) return { label: "BOM", className: "bg-primary/15 text-primary" };
    return { label: "ÓTIMO", className: "bg-primary/15 text-primary" };
  })();

  return (
    <div className="rounded-xl border border-glow bg-card p-6 glow-primary">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg gradient-primary">
          <Wallet className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <p className="text-sm font-bold text-white">Caixa Disponível</p>
          <p className="text-mono text-2xl font-bold text-primary">{formatCurrency(cash)}</p>
        </div>
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Receita de referência: {formatCurrency(referenceIncome)}</span>
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center rounded-full px-2 py-1 font-semibold ${cashStatus.className}`}>
            {cashStatus.label}
          </span>
          <span className="text-primary font-medium">{pct}%</span>
        </div>
      </div>
    </div>
  );
}
