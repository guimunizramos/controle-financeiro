import { useFinance } from "@/contexts/FinanceContext";
import { formatCurrency, getStatusTag } from "@/lib/finance-data";

const barStyles = { ok: "bg-primary", warning: "bg-warning", alert: "bg-destructive" } as const;
const dotStyles = { ok: "bg-primary", warning: "bg-warning", alert: "bg-destructive" } as const;

export function CategoryProgress() {
  const { categoryBudgets, getCategoryTotal, selectedCycle: cycle } = useFinance();

  const categories = categoryBudgets
    .map((cat) => {
      const spent = getCategoryTotal(cat.name, cycle);
      const pct = cat.limit > 0 ? (spent / cat.limit) * 100 : 0;
      const status = getStatusTag(pct);
      return { ...cat, spent, pct, status };
    })
    .sort((a, b) => b.pct - a.pct);

  return (
    <div className="rounded-xl border bg-card p-5 space-y-4">
      <h3 className="font-bold text-sm text-white uppercase tracking-wider">Categorias · {cycle}</h3>
      <div className="space-y-3">
        {categories.map((cat) => (
          <div key={cat.name} className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${dotStyles[cat.status.color]}`} />
                <span>{cat.name}</span>
              </div>
              <span className="text-mono text-xs text-muted-foreground">
                {formatCurrency(cat.spent)} / {formatCurrency(cat.limit)}
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
              <div className={`h-full rounded-full transition-all ${barStyles[cat.status.color]}`} style={{ width: `${Math.min(cat.pct, 100)}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
