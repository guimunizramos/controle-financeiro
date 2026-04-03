import { useFinance } from "@/contexts/FinanceContext";
import { formatCurrency, getDaysUntilClosing, getStatusTag } from "@/lib/finance-data";
import type { Card } from "@/lib/finance-data";
import { CreditCard } from "lucide-react";

const statusStyles = {
  ok: "text-primary",
  warning: "text-warning",
  alert: "text-destructive",
} as const;

const barStyles = {
  ok: "bg-primary",
  warning: "bg-warning",
  alert: "bg-destructive",
} as const;

export function InvoiceCard({ card }: { card: Card }) {
  const { getCardTotal, selectedCycle: cycle } = useFinance();
  const total = getCardTotal(card.owner, cycle);
  const pct = (total / card.limit) * 100;
  const status = getStatusTag(pct);
  const daysLeft = getDaysUntilClosing(card);

  return (
    <div className="rounded-xl border bg-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CreditCard className="h-5 w-5 text-white" />
          <span className="font-bold text-white">Cartões {card.owner}</span>
        </div>
        <span className={`text-xs font-bold px-2 py-1 rounded-md bg-secondary ${statusStyles[status.color]}`}>
          {status.label}
        </span>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-mono font-semibold">{formatCurrency(total)}</span>
          <span className="text-muted-foreground">de {formatCurrency(card.limit)}</span>
        </div>
        <div className="h-2 rounded-full bg-secondary overflow-hidden">
          <div className={`h-full rounded-full transition-all ${barStyles[status.color]}`} style={{ width: `${Math.min(pct, 100)}%` }} />
        </div>
        <p className="text-xs text-muted-foreground">
          Fecha em <span className="text-foreground font-medium">{daysLeft} dias</span> · Vence dia {card.dueDay}
        </p>
      </div>
    </div>
  );
}
