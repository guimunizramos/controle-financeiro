import { useState } from "react";
import { useFinance } from "@/contexts/FinanceContext";
import { formatCurrency, getCurrentCycle } from "@/lib/finance-data";
import { ArrowDownLeft, ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react";
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

function determineCycle(date: string, cardName: string, cards: { name: string; closingDay: number }[]): string {
  const card = cards.find((c) => c.name === cardName);
  if (!card) return getCurrentCycle();
  const d = new Date(date + "T12:00:00");
  const day = d.getDate();
  const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  if (day <= card.closingDay) {
    return `${months[d.getMonth()]}/${d.getFullYear()}`;
  }
  const next = new Date(d.getFullYear(), d.getMonth() + 1, 1);
  return `${months[next.getMonth()]}/${next.getFullYear()}`;
}

export function Lancamentos() {
  const { transactions, cards, categoryBudgets, addTransaction, removeTransaction } = useFinance();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ date: new Date().toISOString().slice(0, 10), description: "", amount: "", card: "", category: "" });

  const sorted = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const monthMap: Record<string, number> = { Jan: 0, Fev: 1, Mar: 2, Abr: 3, Mai: 4, Jun: 5, Jul: 6, Ago: 7, Set: 8, Out: 9, Nov: 10, Dez: 11 };
  const parseCycle = (cycle: string) => {
    const [month, year] = cycle.split("/");
    return new Date(Number(year), monthMap[month] ?? 0, 1).getTime();
  };
  const cycles = [...new Set(sorted.map((t) => t.cycle))]
    .sort((a, b) => parseCycle(b) - parseCycle(a));
  const currentCycle = getCurrentCycle();
  const availableCycles = cycles.includes(currentCycle) ? cycles : [currentCycle, ...cycles].sort((a, b) => parseCycle(b) - parseCycle(a));
  const [selectedCycle, setSelectedCycle] = useState<string>(availableCycles[0] ?? currentCycle);
  const selectedCycleIndex = availableCycles.indexOf(selectedCycle);
  const selectedCycleTransactions = sorted.filter((transaction) => transaction.cycle === selectedCycle);
  const selectedCycleTotal = selectedCycleTransactions.reduce((sum, transaction) => sum + transaction.amount, 0);

  const handleSubmit = () => {
    if (!form.description || !form.amount || !form.card || !form.category) return;
    const cycle = determineCycle(form.date, form.card, cards);
    addTransaction({
      date: form.date,
      description: form.description.trim(),
      amount: parseFloat(form.amount),
      card: form.card,
      category: form.category,
      cycle,
    });
    setForm({ date: new Date().toISOString().slice(0, 10), description: "", amount: "", card: "", category: "" });
    setOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Histórico de Lançamentos</h2>
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
                  <Label className="text-xs">Data</Label>
                  <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="bg-secondary border-border" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Valor (R$)</Label>
                  <Input type="number" step="0.01" min="0" placeholder="0,00" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="bg-secondary border-border" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Descrição</Label>
                <Input placeholder="Ex: iFood, Uber, Supermercado..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="bg-secondary border-border" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Cartão (Origem)</Label>
                  <Select value={form.card} onValueChange={(v) => setForm({ ...form, card: v })}>
                    <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      {cards.map((c) => <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Categoria</Label>
                  <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                    <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      {categoryBudgets.map((c) => <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {form.card && form.date && (
                <p className="text-xs text-muted-foreground">
                  Ciclo calculado: <span className="text-primary font-medium">{determineCycle(form.date, form.card, cards)}</span>
                </p>
              )}
              <Button onClick={handleSubmit} className="w-full gradient-primary text-primary-foreground">
                Registrar Gasto
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 bg-secondary/50 border-b">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => selectedCycleIndex >= 0 && setSelectedCycle(availableCycles[selectedCycleIndex + 1])}
            disabled={selectedCycleIndex < 0 || selectedCycleIndex === availableCycles.length - 1}
            className="h-8 w-8"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="text-center">
            <h3 className="text-2xl md:text-3xl font-bold tracking-tight">{selectedCycle}</h3>
            <span className="text-sm text-destructive">-{formatCurrency(selectedCycleTotal)}</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => selectedCycleIndex > 0 && setSelectedCycle(availableCycles[selectedCycleIndex - 1])}
            disabled={selectedCycleIndex <= 0}
            className="h-8 w-8"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        <div className="hidden md:grid grid-cols-[1fr_100px_80px_110px_100px_40px] gap-2 px-5 py-2 text-xs text-muted-foreground uppercase tracking-wider border-b">
          <span>Descrição</span><span>Valor</span><span>Cartão</span><span>Categoria</span><span>Data</span><span></span>
        </div>
        <div className="divide-y divide-border/50">
          {selectedCycleTransactions.map((tx, i) => {
            const globalIdx = transactions.indexOf(tx);
            return (
              <div key={i} className="group grid grid-cols-1 md:grid-cols-[1fr_100px_80px_110px_100px_40px] gap-1 md:gap-2 px-5 py-3 hover:bg-secondary/30 transition-colors items-center">
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
          {selectedCycleTransactions.length === 0 && (
            <p className="px-5 py-6 text-sm text-muted-foreground">Nenhum lançamento neste ciclo.</p>
          )}
        </div>
      </div>
    </div>
  );
}
