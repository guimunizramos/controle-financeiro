import { useState } from "react";
import { useFinance } from "@/contexts/FinanceContext";
import { getCurrentCycle } from "@/lib/finance-data";
import { formatCurrency } from "@/lib/finance-data";
import { Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CashCard() {
  const { getAvailableCash, addEntry, selectedCycle } = useFinance();
  const cash = getAvailableCash();
  const [open, setOpen] = useState(false);
  const [entryForm, setEntryForm] = useState({
    description: "",
    amount: "",
    date: new Date().toISOString().slice(0, 10),
  });

  const handleAddEntry = async () => {
    const amount = Number.parseFloat(entryForm.amount);
    if (!entryForm.description.trim() || !Number.isFinite(amount) || amount <= 0 || !entryForm.date) return;

    await addEntry({
      type: "income",
      description: entryForm.description.trim(),
      amount,
      date: entryForm.date,
      cycle: selectedCycle || getCurrentCycle(),
    });

    setEntryForm({
      description: "",
      amount: "",
      date: new Date().toISOString().slice(0, 10),
    });
    setOpen(false);
  };

  return (
    <div className="rounded-xl border border-glow bg-card p-6 glow-primary">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg gradient-primary">
          <Wallet className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <p className="text-sm font-bold text-white">Caixa Disponível</p>
          <p className="text-mono text-2xl font-bold text-primary">{formatCurrency(cash)}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="h-7 px-2 text-xs gradient-primary text-primary-foreground">
              + Entrada
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle>Nova Entrada</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs">Descrição</Label>
                <Input
                  value={entryForm.description}
                  onChange={(e) => setEntryForm((prev) => ({ ...prev, description: e.target.value }))}
                  className="bg-secondary border-border"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Valor</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={entryForm.amount}
                    onChange={(e) => setEntryForm((prev) => ({ ...prev, amount: e.target.value }))}
                    className="bg-secondary border-border"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Data</Label>
                  <Input
                    type="date"
                    value={entryForm.date}
                    onChange={(e) => setEntryForm((prev) => ({ ...prev, date: e.target.value }))}
                    className="bg-secondary border-border"
                  />
                </div>
              </div>
              <Button onClick={() => void handleAddEntry()} className="w-full gradient-primary text-primary-foreground">
                Salvar Entrada
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
