import { useMemo, useState } from "react";
import { useFinance } from "@/contexts/FinanceContext";
import { formatCurrency, MONTH_INDEX, MONTHS } from "@/lib/finance-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus } from "lucide-react";

function cycleToDate(cycle: string): Date {
  const [monthLabel, yearLabel] = cycle.split("/");
  const month = MONTH_INDEX[monthLabel] ?? 0;
  const year = Number.parseInt(yearLabel ?? "0", 10);
  return new Date(year, month, 1);
}

function cycleToLongLabel(cycle: string): string {
  const date = cycleToDate(cycle);
  const month = MONTHS[date.getMonth()];
  return `${month}/${date.getFullYear()}`;
}

export function ComprasParceladas() {
  const { installmentPurchases, addInstallmentPurchase, markInstallmentAsPaid, cards, categoryBudgets } = useFinance();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    description: "",
    totalValue: "",
    totalInstallments: "2",
    cardOriginId: "",
    category: "Caixa",
    firstInstallmentDate: new Date().toISOString().slice(0, 10),
  });

  const sortedPurchases = useMemo(
    () => [...installmentPurchases].sort((a, b) => b.id.localeCompare(a.id)),
    [installmentPurchases]
  );

  const submit = () => {
    const totalValue = Number.parseFloat(form.totalValue);
    const totalInstallments = Number.parseInt(form.totalInstallments, 10);
    if (!form.description.trim() || !form.cardOriginId || !form.category) return;
    if (!Number.isFinite(totalValue) || totalValue <= 0) return;
    if (!Number.isInteger(totalInstallments) || totalInstallments < 2) return;

    addInstallmentPurchase({
      description: form.description.trim(),
      totalValue,
      totalInstallments,
      cardOriginId: form.cardOriginId,
      category: form.category,
      firstInstallmentDate: form.firstInstallmentDate,
    });

    setForm({
      description: "",
      totalValue: "",
      totalInstallments: "2",
      cardOriginId: "",
      category: "Caixa",
      firstInstallmentDate: new Date().toISOString().slice(0, 10),
    });
    setOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Compras Parceladas</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-1.5 gradient-primary text-primary-foreground">
              <Plus className="h-4 w-4" /> Nova Compra Parcelada
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle>Adicionar Compra Parcelada</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 pt-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Descrição</Label>
                <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="bg-secondary border-border" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Valor Total (R$)</Label>
                  <Input type="number" min="0" step="0.01" value={form.totalValue} onChange={(e) => setForm({ ...form, totalValue: e.target.value })} className="bg-secondary border-border" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Qtd Parcelas</Label>
                  <Input type="number" min="2" step="1" value={form.totalInstallments} onChange={(e) => setForm({ ...form, totalInstallments: e.target.value })} className="bg-secondary border-border" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Cartão</Label>
                  <Select value={form.cardOriginId} onValueChange={(v) => setForm({ ...form, cardOriginId: v })}>
                    <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      {cards.map((card) => <SelectItem key={card.name} value={card.name}>{card.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Categoria</Label>
                  <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                    <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      {categoryBudgets.map((cat) => <SelectItem key={cat.name} value={cat.name}>{cat.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Data da 1ª Parcela</Label>
                <Input type="date" value={form.firstInstallmentDate} onChange={(e) => setForm({ ...form, firstInstallmentDate: e.target.value })} className="bg-secondary border-border" />
              </div>
              <Button onClick={submit} className="w-full gradient-primary text-primary-foreground">Adicionar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {sortedPurchases.map((purchase) => {
          const remainingInstallments = purchase.totalInstallments - purchase.paidInstallments;
          const progress = purchase.totalInstallments > 0 ? (purchase.paidInstallments / purchase.totalInstallments) * 100 : 0;
          return (
            <div key={purchase.id} className="rounded-xl border border-border bg-card p-5 space-y-3">
              <p className="text-sm text-muted-foreground uppercase tracking-wider">Compra Parcelada</p>
              <h3 className="text-base font-semibold">{purchase.description}</h3>
              <div className="space-y-1 text-sm">
                <p>Valor Total: <span className="text-primary">{formatCurrency(purchase.totalValue)}</span></p>
                <p>Valor Parcela: <span className="text-primary">{formatCurrency(purchase.installmentValue)}</span></p>
                <p>Parcelas Pagas: {purchase.paidInstallments}/{purchase.totalInstallments}</p>
                <p>Parcelas Restantes: {remainingInstallments}</p>
                <p>Mês da última parcela: {cycleToLongLabel(purchase.lastInstallmentCycle)}</p>
              </div>
              <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(progress, 100)}%` }} />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => markInstallmentAsPaid(purchase.id)}
                disabled={remainingInstallments <= 0}
                className="w-full"
              >
                Marcar parcela como paga
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
