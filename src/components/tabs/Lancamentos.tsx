import { useMemo, useState } from "react";
import { useFinance } from "@/contexts/FinanceContext";
import { formatCurrency } from "@/lib/finance-data";
import type { InstallmentPurchase, Transaction } from "@/lib/finance-data";
import { ArrowDownLeft, CalendarClock, CreditCard, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const MONTHS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const MONTH_TO_INDEX: Record<string, number> = {
  Jan: 0, Fev: 1, Mar: 2, Abr: 3, Mai: 4, Jun: 5,
  Jul: 6, Ago: 7, Set: 8, Out: 9, Nov: 10, Dez: 11,
};

export function addMonthsToCycle(baseCycle: string, monthsToAdd: number): string {
  const [monthLabel, yearLabel] = baseCycle.split("/");
  const month = MONTH_TO_INDEX[monthLabel] ?? 0;
  const year = Number.parseInt(yearLabel ?? "0", 10);
  const date = new Date(year, month + monthsToAdd, 1);
  return `${MONTHS[date.getMonth()]}/${date.getFullYear()}`;
}

function addMonthsToDate(baseDate: string, monthsToAdd: number): string {
  const date = new Date(baseDate);
  date.setMonth(date.getMonth() + monthsToAdd);
  return date.toISOString().slice(0, 10);
}

function calculatePaidInstallments(firstInstallmentDate: string, totalInstallments: number): number {
  const today = new Date();
  const firstDate = new Date(firstInstallmentDate);

  const monthsDiff =
    (today.getFullYear() - firstDate.getFullYear()) * 12 +
    (today.getMonth() - firstDate.getMonth());

  return Math.max(0, Math.min(totalInstallments, monthsDiff + 1));
}

export function splitAmountIntoInstallments(totalAmount: number, installments: number): number[] {
  const safeInstallments = Math.max(1, Math.trunc(installments));
  const totalInCents = Math.round(totalAmount * 100);
  const baseInstallmentInCents = Math.floor(totalInCents / safeInstallments);
  const remainder = totalInCents - (baseInstallmentInCents * safeInstallments);

  return Array.from({ length: safeInstallments }, (_, index) => {
    const installmentInCents = baseInstallmentInCents + (index < remainder ? 1 : 0);
    return installmentInCents / 100;
  });
}

export function Lancamentos() {
  const {
    transactions,
    cards,
    addTransaction,
    addInstallmentPurchase,
    removeTransaction,
    selectedCycle,
    installmentPurchases,
  } = useFinance();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    description: "",
    amount: "",
    card: "",
    installments: "1",
  });

  const cycleTx = useMemo(
    () =>
      [...transactions]
        .filter((t) => t.cycle === selectedCycle)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [selectedCycle, transactions]
  );

  const handleSubmit = () => {
    if (!form.description || !form.amount || !form.card) return;

    const parsedAmount = Number.parseFloat(form.amount);
    const installments = Math.max(1, Number.parseInt(form.installments || "1", 10));
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) return;

    const installmentAmounts = splitAmountIntoInstallments(parsedAmount, installments);

    if (installments === 1) {
      addTransaction({
        id: crypto.randomUUID(),
        date: form.date,
        description: form.description.trim(),
        amount: parsedAmount,
        card: form.card,
        category: "Caixa",
        cycle: selectedCycle,
      });
    } else {
      const purchaseId = crypto.randomUUID();
      const purchase: InstallmentPurchase = {
        id: purchaseId,
        description: form.description.trim(),
        total_value: parsedAmount,
        total_installments: installments,
        paid_installments: calculatePaidInstallments(form.date, installments),
        installment_value: installmentAmounts[0],
        card_origin_id: form.card,
        category_id: "Caixa",
        first_installment_date: form.date,
      };

      const generatedTransactions: Transaction[] = installmentAmounts.map((installmentAmount, index) => {
        const installmentNumber = index + 1;

        return {
          id: crypto.randomUUID(),
          date: addMonthsToDate(form.date, index),
          description: `${form.description.trim()} (${installmentNumber}/${installments})`,
          amount: installmentAmount,
          card: form.card,
          category: "Caixa",
          cycle: addMonthsToCycle(selectedCycle, index),
          installmentPurchaseId: purchaseId,
        };
      });

      addInstallmentPurchase(purchase, generatedTransactions);
    }

    setForm({
      date: new Date().toISOString().slice(0, 10),
      description: "",
      amount: "",
      card: "",
      installments: "1",
    });
    setOpen(false);
  };

  const cycleTotal = cycleTx.reduce((s, t) => s + t.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Lançamentos do ciclo {selectedCycle}</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5 gradient-primary text-primary-foreground">
              <Plus className="h-4 w-4" /> Novo Gasto
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle>Registrar Gasto</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Data da 1ª parcela</Label>
                  <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="bg-secondary border-border" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Valor Total (R$)</Label>
                  <Input type="number" step="0.01" min="0" placeholder="0,00" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="bg-secondary border-border" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Parcelas</Label>
                  <Input
                    type="number"
                    min="1"
                    step="1"
                    value={form.installments}
                    onChange={(e) => setForm({ ...form, installments: e.target.value })}
                    className="bg-secondary border-border"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Categoria (fixa)</Label>
                  <Input value="Caixa" disabled className="bg-secondary border-border opacity-90" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Descrição</Label>
                <Input placeholder="Ex: iFood, Uber, Supermercado..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="bg-secondary border-border" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Cartão (Origem)</Label>
                <Select value={form.card} onValueChange={(v) => setForm({ ...form, card: v })}>
                  <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {cards.map((c) => <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleSubmit} className="w-full gradient-primary text-primary-foreground">
                Registrar Gasto
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {installmentPurchases.map((purchase) => {
          const nextInstallmentDate =
            purchase.paid_installments >= purchase.total_installments
              ? "Quitado"
              : new Date(addMonthsToDate(purchase.first_installment_date, purchase.paid_installments)).toLocaleDateString("pt-BR");

          return (
            <div key={purchase.id} className="rounded-xl border border-[#00C853]/50 bg-[#0b1110] p-4 shadow-[0_0_24px_rgba(0,200,83,0.12)]">
              <p className="text-sm font-semibold text-[#00C853]">{purchase.description}</p>
              <div className="mt-3 space-y-1 text-xs text-zinc-300">
                <p>Valor Total: <span className="font-medium text-zinc-100">{formatCurrency(purchase.total_value)}</span></p>
                <p>Parcela: <span className="font-medium text-zinc-100">{formatCurrency(purchase.installment_value)}</span></p>
                <p>Progresso: <span className="font-medium text-zinc-100">{purchase.paid_installments}/{purchase.total_installments}</span></p>
                <p className="flex items-center gap-1"><CalendarClock className="h-3.5 w-3.5 text-[#00C853]" /> Próxima Parcela: <span className="font-medium text-zinc-100">{nextInstallmentDate}</span></p>
                <p className="flex items-center gap-1"><CreditCard className="h-3.5 w-3.5 text-[#00C853]" /> Cartão: <span className="font-medium text-zinc-100">{purchase.card_origin_id}</span></p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 bg-secondary/50 border-b">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Ciclo {selectedCycle}</h3>
          <span className="text-mono text-sm font-semibold text-destructive">-{formatCurrency(cycleTotal)}</span>
        </div>
        <div className="hidden md:grid grid-cols-[1fr_100px_80px_110px_100px_40px] gap-2 px-5 py-2 text-xs text-muted-foreground uppercase tracking-wider border-b">
          <span>Descrição</span><span>Valor</span><span>Cartão</span><span>Categoria</span><span>Data</span><span></span>
        </div>
        <div className="divide-y divide-border/50">
          {cycleTx.map((tx, i) => {
            const globalIdx = transactions.indexOf(tx);
            return (
              <div key={tx.id ?? i} className="group grid grid-cols-1 md:grid-cols-[1fr_100px_80px_110px_100px_40px] gap-1 md:gap-2 px-5 py-3 hover:bg-secondary/30 transition-colors items-center">
                <div className="flex items-center gap-3">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-secondary md:hidden">
                    <ArrowDownLeft className="h-3.5 w-3.5 text-destructive" />
                  </div>
                  <span className="text-sm font-medium">{tx.description}</span>
                </div>
                <span className="text-mono text-sm text-destructive">-{formatCurrency(tx.amount)}</span>
                <span className="text-xs text-muted-foreground">{tx.card}</span>
                <span className="text-xs">
                  <span className="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-xs">{tx.category}</span>
                </span>
                <span className="text-mono text-xs text-muted-foreground">{new Date(tx.date).toLocaleDateString("pt-BR")}</span>
                <button
                  onClick={() => removeTransaction(globalIdx)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
