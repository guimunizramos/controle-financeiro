import { useFinance } from "@/contexts/FinanceContext";
import { useInstallmentPurchases } from "@/hooks/use-installment-purchases";
import { formatCurrency, type InstallmentPurchase } from "@/lib/finance-data";
import { CheckCircle2, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";

interface InstallmentPurchaseCardsProps {
  purchases?: InstallmentPurchase[];
  onMarkAsPaid?: (purchaseId: string) => void;
}

function formatProgress(paid: number, total: number): string {
  const bars = 5;
  const filled = Math.round((paid / total) * bars);
  return `[${"█".repeat(filled)}${"░".repeat(Math.max(0, bars - filled))}]`;
}

export function InstallmentPurchaseCards({ purchases, onMarkAsPaid }: InstallmentPurchaseCardsProps) {
  const { transactions } = useFinance();
  const installmentApi = useInstallmentPurchases();
  const installmentPurchases = purchases ?? installmentApi.installmentPurchases;
  const markInstallmentAsPaid = onMarkAsPaid ?? installmentApi.markInstallmentAsPaid;

  if (!installmentPurchases.length) {
    return (
      <div className="rounded-xl border border-dashed border-primary/40 bg-card p-5">
        <p className="text-sm text-muted-foreground">Nenhuma compra parcelada registrada.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {installmentPurchases.map((purchase) => {
        const purchaseInstallments = transactions
          .filter((tx) => tx.installmentPurchaseId === purchase.id)
          .sort((a, b) => (a.installmentNumber ?? 0) - (b.installmentNumber ?? 0));

        const lastInstallment = purchaseInstallments[purchaseInstallments.length - 1];
        const remainingInstallments = Math.max(0, purchase.totalInstallments - purchase.paidInstallments);
        const isFinished = purchase.paidInstallments >= purchase.totalInstallments;

        return (
          <div key={purchase.id} className="rounded-xl border border-primary/20 bg-card p-5 space-y-4 shadow-[0_0_0_1px_rgba(0,200,83,0.1)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-primary">Compra Parcelada</p>
                <h3 className="font-semibold text-base">{purchase.description}</h3>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                  <CreditCard className="h-3.5 w-3.5" /> {purchase.cardOriginId} · {purchase.categoryId}
                </p>
              </div>
              <span className="text-xs rounded-full px-2 py-1 bg-secondary text-primary font-semibold">
                {purchase.paidInstallments}/{purchase.totalInstallments}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg bg-secondary/40 p-3">
                <p className="text-xs text-muted-foreground">Valor Total</p>
                <p className="text-mono font-semibold">{formatCurrency(purchase.totalValue)}</p>
              </div>
              <div className="rounded-lg bg-secondary/40 p-3">
                <p className="text-xs text-muted-foreground">Valor da Parcela</p>
                <p className="text-mono font-semibold text-primary">{formatCurrency(purchase.installmentValue)}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg bg-secondary/20 p-3">
                <p className="text-xs text-muted-foreground">Parcelas Restantes</p>
                <p className="font-semibold">{remainingInstallments}</p>
              </div>
              <div className="rounded-lg bg-secondary/20 p-3">
                <p className="text-xs text-muted-foreground">Mês da Última Parcela</p>
                <p className="font-semibold">
                  {lastInstallment
                    ? new Date(lastInstallment.date).toLocaleDateString("pt-BR", { month: "short", year: "numeric" })
                    : "-"}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Progresso: <span className="text-primary font-mono">{formatProgress(purchase.paidInstallments, purchase.totalInstallments)}</span></p>
              <Button
                size="sm"
                disabled={isFinished}
                onClick={() => markInstallmentAsPaid(purchase.id)}
                className="gradient-primary text-primary-foreground disabled:opacity-40"
              >
                {isFinished ? <><CheckCircle2 className="h-3.5 w-3.5" /> Quitado</> : "Marcar parcela paga"}
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
