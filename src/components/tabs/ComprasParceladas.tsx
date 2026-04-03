import { InstallmentPurchaseCards } from "@/components/InstallmentPurchaseCards";

export function ComprasParceladas() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Compras Parceladas</h2>
        <span className="text-xs text-muted-foreground">Acompanhe progresso e próxima parcela</span>
      </div>
      <InstallmentPurchaseCards />
    </div>
  );
}
