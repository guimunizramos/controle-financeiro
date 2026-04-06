import { useMemo, useState } from "react";
import { useFinance } from "@/contexts/FinanceContext";
import { formatCurrency, getCardLabel, getCurrentCycle } from "@/lib/finance-data";
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

export function Lancamentos() {
  const { transactions, entries, removeEntry, addEntry, cards, categoryBudgets, addTransaction, removeTransaction, selectedCycle, setSelectedCycle, availableCycles } = useFinance();
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [entryOpen, setEntryOpen] = useState(false);
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    description: "",
    amount: "",
    card: "",
    category: "",
  });
  const [entryForm, setEntryForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    description: "",
    amount: "",
  });
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [cardFilter, setCardFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const cycleEntries = useMemo(
    () => entries.filter((entry) => entry.type === "income" && entry.cycle === selectedCycle),
    [entries, selectedCycle]
  );
  const cycleTx = useMemo(
    () => [...transactions].filter((t) => t.cycle === selectedCycle),
    [selectedCycle, transactions]
  );
  const uniqueCards = useMemo(
    () => [...new Set(cycleTx.map((tx) => tx.card))],
    [cycleTx]
  );
  const uniqueCategories = useMemo(
    () => [...new Set(cycleTx.map((tx) => tx.category))],
    [cycleTx]
  );
  const filteredTx = useMemo(() => {
    const filtered = cycleTx.filter((tx) => {
      const matchesCard = cardFilter === "all" || tx.card === cardFilter;
      const matchesCategory = categoryFilter === "all" || tx.category === categoryFilter;
      return matchesCard && matchesCategory;
    });
    return filtered.sort((a, b) => {
      const diff = new Date(a.date).getTime() - new Date(b.date).getTime();
      return sortOrder === "asc" ? diff : -diff;
    });
  }, [cardFilter, categoryFilter, cycleTx, sortOrder]);
  const cycleEntriesTotal = useMemo(
    () => cycleEntries.reduce((sum, entry) => sum + entry.amount, 0),
    [cycleEntries]
  );

  const sortedCycles = useMemo(
    () => [...availableCycles].sort((a, b) => availableCycles.indexOf(a) - availableCycles.indexOf(b)),
    [availableCycles]
  );
  const currentCycleIndex = sortedCycles.indexOf(selectedCycle);

  const goToPreviousCycle = () => {
    if (currentCycleIndex < sortedCycles.length - 1) {
      setSelectedCycle(sortedCycles[currentCycleIndex + 1]);
    }
  };

  const goToNextCycle = () => {
    if (currentCycleIndex > 0) {
      setSelectedCycle(sortedCycles[currentCycleIndex - 1]);
    }
  };

  const handleSubmitExpense = async () => {
    if (!form.description.trim() || !form.amount || !form.card || !form.category || !form.date) return;

    const parsedAmount = Number.parseFloat(form.amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) return;

    addTransaction({
      date: form.date,
      description: form.description.trim(),
      amount: parsedAmount,
      card: form.card,
      category: form.category,
      cycle: selectedCycle,
    });

    if (form.card === "Pix / Débito") {
      await addEntry({
        type: "pix_out",
        amount: parsedAmount,
        description: form.description.trim(),
        date: form.date,
        cycle: selectedCycle || getCurrentCycle(),
      });
    }

    setForm({
      date: new Date().toISOString().slice(0, 10),
      description: "",
      amount: "",
      card: "",
      category: "",
    });
    setExpenseOpen(false);
  };

  const handleSubmitEntry = async () => {
    if (!entryForm.description || !entryForm.amount) return;
    const parsedAmount = Number.parseFloat(entryForm.amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) return;

    await addEntry({
      type: "income",
      description: entryForm.description.trim(),
      amount: parsedAmount,
      date: entryForm.date,
      cycle: selectedCycle || getCurrentCycle(),
    });

    setEntryForm({
      date: new Date().toISOString().slice(0, 10),
      description: "",
      amount: "",
    });
    setEntryOpen(false);
  };

  const cycleTotal = cycleTx.reduce((s, t) => s + t.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 mx-auto">
          <button onClick={goToPreviousCycle} disabled={currentCycleIndex >= sortedCycles.length - 1} className="p-1 text-muted-foreground disabled:opacity-30">
            <ChevronLeft className="h-6 w-6" />
          </button>
          <h2 className="text-3xl font-semibold text-center min-w-48">{selectedCycle}</h2>
          <button onClick={goToNextCycle} disabled={currentCycleIndex <= 0} className="p-1 text-muted-foreground disabled:opacity-30">
            <ChevronRight className="h-6 w-6" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <Dialog open={entryOpen} onOpenChange={setEntryOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="gap-1.5">
                <Plus className="h-4 w-4" /> Nova Entrada
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader>
                <DialogTitle>Registrar Entrada</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Data</Label>
                    <Input type="date" value={entryForm.date} onChange={(e) => setEntryForm({ ...entryForm, date: e.target.value })} className="bg-secondary border-border" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Valor (R$)</Label>
                    <Input type="number" step="0.01" min="0" placeholder="0,00" value={entryForm.amount} onChange={(e) => setEntryForm({ ...entryForm, amount: e.target.value })} className="bg-secondary border-border" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Descrição</Label>
                  <Input placeholder="Ex: salário, freelas..." value={entryForm.description} onChange={(e) => setEntryForm({ ...entryForm, description: e.target.value })} className="bg-secondary border-border" />
                </div>
                <Button onClick={() => void handleSubmitEntry()} className="w-full gradient-primary text-primary-foreground">
                  Registrar Entrada
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={expenseOpen} onOpenChange={setExpenseOpen}>
            <DialogTrigger asChild>
              <Button type="button" size="sm" className="gap-1.5 gradient-primary text-primary-foreground">
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
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Categoria</Label>
                    <Select value={form.category} onValueChange={(value) => setForm({ ...form, category: value })}>
                      <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        {categoryBudgets.map((category) => (
                          <SelectItem key={category.name} value={category.name}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Nome + Cartão</Label>
                    <Select value={form.card} onValueChange={(v) => setForm({ ...form, card: v })}>
                      <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        <SelectItem value="Pix / Débito">Pix / Débito</SelectItem>
                        {cards.map((c, idx) => {
                          const label = getCardLabel(c);
                          return <SelectItem key={`${label}-${idx}`} value={label}>{label}</SelectItem>;
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Descrição</Label>
                  <Input placeholder="Ex: iFood, Uber, Supermercado..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="bg-secondary border-border" />
                </div>
                <Button onClick={() => void handleSubmitExpense()} className="w-full gradient-primary text-primary-foreground">
                  Registrar Gasto
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 bg-secondary/50 border-b">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Entradas</h3>
          <span className="text-mono text-sm font-semibold text-primary">{formatCurrency(cycleEntriesTotal)}</span>
        </div>
        <div className="divide-y divide-border/50">
          {cycleEntries.length === 0 && (
            <div className="px-5 py-4 text-xs text-muted-foreground">Nenhuma entrada registrada neste ciclo.</div>
          )}
          {cycleEntries.map((entry) => (
            <div key={`${entry.id ?? `${entry.description}-${entry.date}-${entry.amount}`}`} className="group grid grid-cols-[1fr_100px_120px_40px] gap-2 px-5 py-3 items-center">
              <span className="text-sm font-medium">{entry.description}</span>
              <span className="text-mono text-sm text-primary">R$ {entry.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              <span className="text-mono text-xs text-muted-foreground">{new Date(entry.date).toLocaleDateString("pt-BR")}</span>
              <button
                onClick={() => entry.id && void removeEntry(entry.id)}
                disabled={!entry.id}
                className="opacity-0 group-hover:opacity-100 disabled:opacity-30 transition-opacity text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="px-5 py-3 border-b bg-card">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <Select value={sortOrder} onValueChange={(value: "desc" | "asc") => setSortOrder(value)}>
              <SelectTrigger className="h-8 text-xs bg-secondary border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="desc">Mais recente primeiro</SelectItem>
                <SelectItem value="asc">Mais antigo primeiro</SelectItem>
              </SelectContent>
            </Select>
            <Select value={cardFilter} onValueChange={setCardFilter}>
              <SelectTrigger className="h-8 text-xs bg-secondary border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="all">Todos os cartões</SelectItem>
                {uniqueCards.map((card) => (
                  <SelectItem key={card} value={card}>
                    {card}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="h-8 text-xs bg-secondary border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="all">Todas as categorias</SelectItem>
                {uniqueCategories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex items-center justify-between px-5 py-3 bg-secondary/50 border-b">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Gastos do Ciclo {selectedCycle}</h3>
          <span className="text-mono text-sm font-semibold text-destructive">-{formatCurrency(cycleTotal)}</span>
        </div>
        <div className="hidden md:grid grid-cols-[1fr_100px_160px_110px_100px_40px] gap-2 px-5 py-2 text-xs text-muted-foreground uppercase tracking-wider border-b">
          <span>Descrição</span><span>Valor</span><span>Cartão</span><span>Categoria</span><span>Data</span><span></span>
        </div>
        <div className="divide-y divide-border/50">
          {filteredTx.map((tx) => {
            const globalIdx = transactions.indexOf(tx);
            return (
              <div key={tx.id} className="group grid grid-cols-1 md:grid-cols-[1fr_100px_160px_110px_100px_40px] gap-1 md:gap-2 px-5 py-3 hover:bg-secondary/30 transition-colors items-center">
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
