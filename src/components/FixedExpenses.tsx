import { fixedExpenses, formatCurrency } from "@/lib/finance-data";
import { CalendarClock } from "lucide-react";

export function FixedExpenses() {
  const total = fixedExpenses.reduce((s, e) => s + e.amount, 0);

  return (
    <div className="rounded-xl border bg-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Contas Fixas</h3>
        <span className="text-mono text-sm font-semibold text-primary">{formatCurrency(total)}</span>
      </div>
      <div className="space-y-1">
        {fixedExpenses.map((exp) => (
          <div key={exp.name} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
            <div className="flex items-center gap-3">
              <CalendarClock className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm">{exp.name}</p>
                <p className="text-xs text-muted-foreground">Dia {exp.dueDay} · {exp.category}</p>
              </div>
            </div>
            <span className="text-mono text-sm">{formatCurrency(exp.amount)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
