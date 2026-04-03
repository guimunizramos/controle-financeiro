import {
  cards,
  fixedExpenses,
  categoryBudgets,
  referenceIncome,
  formatCurrency,
} from "@/lib/finance-data";
import { CreditCard, CalendarClock, Tag, DollarSign } from "lucide-react";

export function Configuracoes() {
  return (
    <div className="space-y-6">
      {/* Valor de Referência */}
      <div className="rounded-xl border border-glow bg-card p-6 glow-primary">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-primary">
            <DollarSign className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Valor de Referência (Receita)</p>
            <p className="text-mono text-2xl font-bold text-primary">
              {formatCurrency(referenceIncome)}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Cartões */}
        <div className="rounded-xl border bg-card p-5 space-y-4">
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
              Cartões (Origem)
            </h3>
          </div>
          <div className="space-y-1">
            {cards.map((card) => (
              <div
                key={card.name}
                className="flex items-center justify-between py-3 border-b border-border/50 last:border-0"
              >
                <div>
                  <p className="text-sm font-medium">{card.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Fecha dia {card.closingDay} · Vence dia {card.dueDay}
                  </p>
                </div>
                <span className="text-mono text-sm text-primary">
                  {formatCurrency(card.limit)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Contas Fixas */}
        <div className="rounded-xl border bg-card p-5 space-y-4">
          <div className="flex items-center gap-2">
            <CalendarClock className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
              Contas Fixas
            </h3>
          </div>
          <div className="space-y-1">
            {fixedExpenses.map((exp) => (
              <div
                key={exp.name}
                className="flex items-center justify-between py-2.5 border-b border-border/50 last:border-0"
              >
                <div>
                  <p className="text-sm">{exp.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Dia {exp.dueDay} · {exp.category}
                  </p>
                </div>
                <span className="text-mono text-sm">{formatCurrency(exp.amount)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Categorias */}
        <div className="rounded-xl border bg-card p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
              Categorias (Limite)
            </h3>
          </div>
          <div className="space-y-1">
            {categoryBudgets.map((cat) => (
              <div
                key={cat.name}
                className="flex items-center justify-between py-2.5 border-b border-border/50 last:border-0"
              >
                <span className="text-sm">{cat.name}</span>
                <span className="text-mono text-sm text-primary">
                  {formatCurrency(cat.limit)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
