import { useMemo, useState } from "react";
import { useFinance } from "@/contexts/FinanceContext";
import { formatCurrency, getCardLabel, MONTH_INDEX, MONTHS } from "@/lib/finance-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Pencil, Plus } from "lucide-react";

type InstallmentValueMode = "total" | "installment";

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
  const { installmentPurchases, addInstallmentPurchase, updateInstallmentPurchase, markInstallmentAsPaid, cards, categoryBudgets } = useFinance();
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [valueMode, setValueMode] = useState<InstallmentValueMode>("total");
  const [editValueMode, setEditValueMode] = useState<InstallmentValueMode>("total");
  const [editingPurchaseId, setEditingPurchaseId] = useState<string | null>(null);
  const [form, setForm] = useState({
    description: "",
    totalValue: "",
    installmentValue: "",
    totalInstallments: "2",
    cardOriginId: "",
    category: "Caixa",
    firstInstallmentDate: new Date().toISOString().slice(0, 10),
  });
  const [editForm, setEditForm] = useState({
    description: "",
    totalValue: "",
    installmentValue: "",
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
    const totalInstallments = Number.parseInt(form.totalInstallments, 10);
    if (!form.description.trim() || !form.cardOriginId || !form.category) return;
    if (!Number.isInteger(totalInstallments) || totalInstallments < 2) return;

    const rawValue = valueMode === "total" ? Number.parseFloat(form.totalValue) : Number.parseFloat(form.installmentValue);
    if (!Number.isFinite(rawValue) || rawValue <= 0) return;

    const totalValue = valueMode === "total" ? rawValue : rawValue * totalInstallments;

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
      installmentValue: "",
      totalInstallments: "2",
      cardOriginId: "",
      category: "Caixa",
      firstInstallmentDate: new Date().toISOString().slice(0, 10),
    });
    setOpen(false);
  };

  const startEdit = (purchaseId: string) => {
    const purchase = installmentPurchases.find((item) => item.id === purchaseId);
    if (!purchase) return;

    setEditingPurchaseId(purchaseId);
    setEditValueMode("total");
    setEditForm({
      description: purchase.description,
      totalValue: purchase.totalValue.toFixed(2),
      installmentValue: purchase.installmentValue.toFixed(2),
      totalInstallments: String(purchase.totalInstallments),
      cardOriginId: purchase.cardOriginId,
      category: purchase.category,
      firstInstallmentDate: purchase.firstInstallmentDate,
    });
    setEditOpen(true);
  };

  const submitEdit = () => {
    if (!editingPurchaseId) return;
    const totalInstallments = Number.parseInt(editForm.totalInstallments, 10);
    if (!editForm.description.trim() || !editForm.cardOriginId || !editForm.category) return;
    if (!Number.isInteger(totalInstallments) || totalInstallments < 2) return;

    const rawValue = editValueMode === "total" ? Number.parseFloat(editForm.totalValue) : Number.parseFloat(editForm.installmentValue);
    if (!Number.isFinite(rawValue) || rawValue <= 0) return;

    const totalValue = editValueMode === "total" ? rawValue : rawValue * totalInstallments;

    updateInstallmentPurchase({
      id: editingPurchaseId,
      description: editForm.description.trim(),
      totalValue,
      totalInstallments,
      cardOriginId: editForm.cardOriginId,
      category: editForm.category,
      firstInstallmentDate: editForm.firstInstallmentDate,
    });

    setEditOpen(false);
    setEditingPurchaseId(null);
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
                  <Label className="text-xs">Tipo de valor</Label>
                  <Select value={valueMode} onValueChange={(v: InstallmentValueMode) => setValueMode(v)}>
                    <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="total">Valor total</SelectItem>
                      <SelectItem value="installment">Valor da parcela</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Qtd Parcelas</Label>
                  <Input type="number" min="2" step="1" value={form.totalInstallments} onChange={(e) => setForm({ ...form, totalInstallments: e.target.value })} className="bg-secondary border-border" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{valueMode === "total" ? "Valor Total (R$)" : "Valor da Parcela (R$)"}</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={valueMode === "total" ? form.totalValue : form.installmentValue}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      ...(valueMode === "total" ? { totalValue: e.target.value } : { installmentValue: e.target.value }),
                    })
                  }
                  className="bg-secondary border-border"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Cartão</Label>
                  <Select value={form.cardOriginId} onValueChange={(v) => setForm({ ...form, cardOriginId: v })}>
                    <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      {cards.map((card, idx) => {
                        const label = getCardLabel(card);
                        return <SelectItem key={`${label}-${idx}`} value={label}>{label}</SelectItem>;
                      })}
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
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle>Editar Compra Parcelada</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 pt-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Descrição</Label>
                <Input value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} className="bg-secondary border-border" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Tipo de valor</Label>
                  <Select value={editValueMode} onValueChange={(v: InstallmentValueMode) => setEditValueMode(v)}>
                    <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="total">Valor total</SelectItem>
                      <SelectItem value="installment">Valor da parcela</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Qtd Parcelas</Label>
                  <Input type="number" min="2" step="1" value={editForm.totalInstallments} onChange={(e) => setEditForm({ ...editForm, totalInstallments: e.target.value })} className="bg-secondary border-border" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{editValueMode === "total" ? "Valor Total (R$)" : "Valor da Parcela (R$)"}</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={editValueMode === "total" ? editForm.totalValue : editForm.installmentValue}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      ...(editValueMode === "total" ? { totalValue: e.target.value } : { installmentValue: e.target.value }),
                    })
                  }
                  className="bg-secondary border-border"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Cartão</Label>
                  <Select value={editForm.cardOriginId} onValueChange={(v) => setEditForm({ ...editForm, cardOriginId: v })}>
                    <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      {cards.map((card, idx) => {
                        const label = getCardLabel(card);
                        return <SelectItem key={`${label}-${idx}`} value={label}>{label}</SelectItem>;
                      })}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Categoria</Label>
                  <Select value={editForm.category} onValueChange={(v) => setEditForm({ ...editForm, category: v })}>
                    <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      {categoryBudgets.map((cat) => <SelectItem key={cat.name} value={cat.name}>{cat.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Data da 1ª Parcela</Label>
                <Input type="date" value={editForm.firstInstallmentDate} onChange={(e) => setEditForm({ ...editForm, firstInstallmentDate: e.target.value })} className="bg-secondary border-border" />
              </div>
              <Button onClick={submitEdit} className="w-full gradient-primary text-primary-foreground">Salvar alterações</Button>
            </div>
          </DialogContent>
        </Dialog>

        {sortedPurchases.map((purchase) => {
          const remainingInstallments = purchase.totalInstallments - purchase.paidInstallments;
          const progress = purchase.totalInstallments > 0 ? (purchase.paidInstallments / purchase.totalInstallments) * 100 : 0;
          return (
            <div key={purchase.id} className="rounded-xl border border-border bg-card p-5 space-y-4 relative">
              <span className="absolute right-4 top-4 inline-flex items-center rounded-full bg-primary/20 text-primary px-2.5 py-1 text-xs font-semibold">
                {purchase.paidInstallments}/{purchase.totalInstallments} pagas
              </span>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Compra Parcelada</p>
              <h3 className="text-base font-semibold text-white pr-28">{purchase.description}</h3>
              <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
                <p className="text-muted-foreground">Valor total</p>
                <p className="text-right text-primary font-semibold">{formatCurrency(purchase.totalValue)}</p>
                <p className="text-muted-foreground">Valor parcela</p>
                <p className="text-right text-primary font-semibold">{formatCurrency(purchase.installmentValue)}</p>
                <p className="text-muted-foreground">Restantes</p>
                <p className="text-right">{remainingInstallments}</p>
                <p className="text-muted-foreground">Última parcela</p>
                <p className="text-right">{cycleToLongLabel(purchase.lastInstallmentCycle)}</p>
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
              <Button variant="outline" size="sm" onClick={() => startEdit(purchase.id)} className="w-full gap-1.5">
                <Pencil className="h-4 w-4" />
                Editar lançamento
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
