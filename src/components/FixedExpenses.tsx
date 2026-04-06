import { useFinance } from "@/contexts/FinanceContext";
import { formatCurrency } from "@/lib/finance-data";
import { CalendarClock } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

export function FixedExpenses() {
  const { fixedExpenses, entries, addEntry, removeEntry, selectedCycle } = useFinance();
  const total = fixedExpenses.reduce((s, e) => s + e.amount, 0);
  const today = new Date().toISOString().slice(0, 10);

  const findPaidEntry = (expenseName: string) =>
    entries.find((entry) => entry.type === "fixed_paid" && entry.reference_id === expenseName && entry.cycle === selectedCycle);

  const handleCheckedChange = async (expenseName: string, amount: number, checked: boolean) => {
    const existing = findPaidEntry(expenseName);
    if (checked) {
      if (existing) return;
      await addEntry({
        type: "fixed_paid",
        description: expenseName,
        amount,
        reference_id: expenseName,
        cycle: selectedCycle,
        date: today,
      });
      return;
    }
    if (existing?.id) {
      await removeEntry(existing.id);
    }
  };

  return (
    <div className="rounded-xl border bg-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-sm text-white uppercase tracking-wider">Contas Fixas</h3>
        <span className="text-mono text-sm font-semibold text-primary">{formatCurrency(total)}</span>
      </div>
      <div className="space-y-1">
        {fixedExpenses.map((exp) => (
          <div key={exp.name} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
            <div className="flex items-center gap-3">
              <Checkbox
                checked={Boolean(findPaidEntry(exp.name))}
                onCheckedChange={(checked) => void handleCheckedChange(exp.name, exp.amount, checked === true)}
              />
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
