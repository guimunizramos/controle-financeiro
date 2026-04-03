import { useState } from "react";
import { InstallmentPurchaseCards } from "@/components/InstallmentPurchaseCards";
import { useFinance } from "@/contexts/FinanceContext";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export function ComprasParceladas() {
  const { cards, categoryBudgets, addInstallmentPurchase } = useFinance();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    firstInstallmentDate: new Date().toISOString().slice(0, 10),
    description: "",
    totalValue: "",
    totalInstallments: "2",
    cardOriginId: "",
    categoryId: "",
  });

  const handleSubmit = () => {
    if (!form.description || !form.totalValue || !form.totalInstallments || !form.cardOriginId || !form.categoryId) return;

    addInstallmentPurchase({
      description: form.description.trim(),
      totalValue: parseFloat(form.totalValue),
      totalInstallments: Math.max(1, parseInt(form.totalInstallments, 10)),
      cardOriginId: form.cardOriginId,
      categoryId: form.categoryId,
      firstInstallmentDate: form.firstInstallmentDate,
    });

    setForm({
      firstInstallmentDate: new Date().toISOString().slice(0, 10),
      description: "",
      totalValue: "",
      totalInstallments: "2",
      cardOriginId: "",
      categoryId: "",
    });
    setOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Compras Parceladas</h2>
          <span className="text-xs text-muted-foreground">Acompanhe progresso e parcelas restantes</span>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5 gradient-primary text-primary-foreground">
              <Plus className="h-4 w-4" /> Nova compra
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle>Nova Compra Parcelada</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Primeira Parcela</Label>
                  <Input
                    type="date"
                    value={form.firstInstallmentDate}
                    onChange={(e) => setForm({ ...form, firstInstallmentDate: e.target.value })}
                    className="bg-secondary border-border"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Qtd. Parcelas</Label>
                  <Input
                    type="number"
                    min="1"
                    max="48"
                    value={form.totalInstallments}
                    onChange={(e) => setForm({ ...form, totalInstallments: e.target.value })}
                    className="bg-secondary border-border"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Descrição</Label>
                <Input
                  placeholder="Ex: Notebook"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="bg-secondary border-border"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Valor Total (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0,00"
                  value={form.totalValue}
                  onChange={(e) => setForm({ ...form, totalValue: e.target.value })}
                  className="bg-secondary border-border"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Cartão Origem</Label>
                  <Select value={form.cardOriginId} onValueChange={(v) => setForm({ ...form, cardOriginId: v })}>
                    <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      {cards.map((c) => <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Categoria</Label>
                  <Select value={form.categoryId} onValueChange={(v) => setForm({ ...form, categoryId: v })}>
                    <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      {categoryBudgets.map((c) => <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={handleSubmit} className="w-full gradient-primary text-primary-foreground">
                Gerar Parcelas
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <InstallmentPurchaseCards />
    </div>
  );
}
