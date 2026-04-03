import { transactions, formatCurrency } from "@/lib/finance-data";
import { ArrowDownLeft } from "lucide-react";

export function Lancamentos() {
  const sorted = [...transactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const cycles = [...new Set(sorted.map((t) => t.cycle))];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Histórico de Lançamentos</h2>
        <span className="text-xs text-muted-foreground">{transactions.length} registros</span>
      </div>

      {cycles.map((cycle) => {
        const cycleTx = sorted.filter((t) => t.cycle === cycle);
        const cycleTotal = cycleTx.reduce((s, t) => s + t.amount, 0);

        return (
          <div key={cycle} className="rounded-xl border bg-card overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 bg-secondary/50 border-b">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Ciclo {cycle}
              </h3>
              <span className="text-mono text-sm font-semibold text-destructive">
                -{formatCurrency(cycleTotal)}
              </span>
            </div>

            {/* Table header */}
            <div className="hidden md:grid grid-cols-[1fr_100px_80px_110px_100px] gap-2 px-5 py-2 text-xs text-muted-foreground uppercase tracking-wider border-b">
              <span>Descrição</span>
              <span>Valor</span>
              <span>Cartão</span>
              <span>Categoria</span>
              <span>Data</span>
            </div>

            <div className="divide-y divide-border/50">
              {cycleTx.map((tx, i) => (
                <div
                  key={i}
                  className="grid grid-cols-1 md:grid-cols-[1fr_100px_80px_110px_100px] gap-1 md:gap-2 px-5 py-3 hover:bg-secondary/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-secondary md:hidden">
                      <ArrowDownLeft className="h-3.5 w-3.5 text-destructive" />
                    </div>
                    <span className="text-sm font-medium">{tx.description}</span>
                  </div>
                  <span className="text-mono text-sm text-destructive">
                    -{formatCurrency(tx.amount)}
                  </span>
                  <span className="text-xs text-muted-foreground">{tx.card}</span>
                  <span className="text-xs">
                    <span className="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-xs">
                      {tx.category}
                    </span>
                  </span>
                  <span className="text-mono text-xs text-muted-foreground">
                    {new Date(tx.date).toLocaleDateString("pt-BR")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
