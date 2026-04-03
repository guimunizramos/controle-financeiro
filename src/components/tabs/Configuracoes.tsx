import { useMemo, useState } from "react";
import { useFinance } from "@/contexts/FinanceContext";
import { formatCurrency } from "@/lib/finance-data";
import type { CategoryBudget } from "@/lib/finance-data";
import { CreditCard, CalendarClock, Tag, DollarSign, Plus, Trash2, Pencil, Check, X, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

function EditableValue({ value, onSave }: { value: number; onSave: (v: number) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));
  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <Input type="number" className="h-7 w-24 bg-secondary border-border text-xs" value={draft} onChange={(e) => setDraft(e.target.value)} />
        <button onClick={() => { onSave(parseFloat(draft) || 0); setEditing(false); }} className="text-primary"><Check className="h-3.5 w-3.5" /></button>
        <button onClick={() => setEditing(false)} className="text-muted-foreground"><X className="h-3.5 w-3.5" /></button>
      </div>
    );
  }
  return (
    <button onClick={() => { setDraft(String(value)); setEditing(true); }} className="text-mono text-sm text-primary hover:underline cursor-pointer flex items-center gap-1">
      {formatCurrency(value)} <Pencil className="h-3 w-3 opacity-50" />
    </button>
  );
}

export function Configuracoes() {
  const {
    referenceIncome, setReferenceIncome,
    cards, addCard, updateCard, removeCard,
    fixedExpenses, addFixedExpense, updateFixedExpense, removeFixedExpense,
    categoryBudgets, addCategoryBudget, updateCategoryBudget, removeCategoryBudget,
  } = useFinance();

  const editableCategories = useMemo(
    () => categoryBudgets.map((cat, index) => ({ ...cat, index })).filter((cat) => !cat.isFixed),
    [categoryBudgets]
  );
  const caixaCategory = categoryBudgets.find((cat) => cat.name === "Caixa");

  const [cardOpen, setCardOpen] = useState(false);
  const [cardForm, setCardForm] = useState({ name: "", limit: "", closingDay: "", dueDay: "" });
  const [fixedOpen, setFixedOpen] = useState(false);
  const [fixedForm, setFixedForm] = useState({ name: "", dueDay: "", category: "", amount: "" });
  const [catOpen, setCatOpen] = useState(false);
  const [catForm, setCatForm] = useState({ name: "", limit: "" });

  const submitCard = () => {
    if (!cardForm.name || !cardForm.limit) return;
    addCard({ name: cardForm.name.trim(), limit: parseFloat(cardForm.limit), closingDay: parseInt(cardForm.closingDay) || 1, dueDay: parseInt(cardForm.dueDay) || 1 });
    setCardForm({ name: "", limit: "", closingDay: "", dueDay: "" });
    setCardOpen(false);
  };
  const submitFixed = () => {
    if (!fixedForm.name || !fixedForm.amount) return;
    addFixedExpense({ name: fixedForm.name.trim(), dueDay: parseInt(fixedForm.dueDay) || 1, category: fixedForm.category.trim() || "Outros", amount: parseFloat(fixedForm.amount) });
    setFixedForm({ name: "", dueDay: "", category: "", amount: "" });
    setFixedOpen(false);
  };
  const submitCat = () => {
    if (!catForm.name || !catForm.limit) return;
    if (catForm.name.trim().toLowerCase() === "caixa") return;
    addCategoryBudget({ name: catForm.name.trim(), limit: parseFloat(catForm.limit) });
    setCatForm({ name: "", limit: "" });
    setCatOpen(false);
  };

  const [editingIncome, setEditingIncome] = useState(false);
  const [incomeDraft, setIncomeDraft] = useState(String(referenceIncome));

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-glow bg-card p-6 glow-primary">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-primary">
            <DollarSign className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Valor de Referência (Receita)</p>
            {editingIncome ? (
              <div className="flex items-center gap-2 mt-1">
                <Input type="number" className="h-8 w-40 bg-secondary border-border" value={incomeDraft} onChange={(e) => setIncomeDraft(e.target.value)} />
                <button onClick={() => { setReferenceIncome(parseFloat(incomeDraft) || 0); setEditingIncome(false); }} className="text-primary"><Check className="h-4 w-4" /></button>
                <button onClick={() => setEditingIncome(false)} className="text-muted-foreground"><X className="h-4 w-4" /></button>
              </div>
            ) : (
              <button onClick={() => { setIncomeDraft(String(referenceIncome)); setEditingIncome(true); }} className="text-mono text-2xl font-bold text-primary hover:underline cursor-pointer flex items-center gap-2">
                {formatCurrency(referenceIncome)} <Pencil className="h-4 w-4 opacity-50" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="rounded-xl border bg-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Cartões</h3>
            </div>
            <Dialog open={cardOpen} onOpenChange={setCardOpen}>
              <DialogTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7"><Plus className="h-4 w-4" /></Button></DialogTrigger>
              <DialogContent className="bg-card border-border">
                <DialogHeader><DialogTitle>Novo Cartão</DialogTitle></DialogHeader>
                <div className="space-y-3 pt-2">
                  <div className="space-y-1"><Label className="text-xs">Nome</Label><Input value={cardForm.name} onChange={(e) => setCardForm({ ...cardForm, name: e.target.value })} className="bg-secondary border-border" /></div>
                  <div className="space-y-1"><Label className="text-xs">Limite</Label><Input type="number" value={cardForm.limit} onChange={(e) => setCardForm({ ...cardForm, limit: e.target.value })} className="bg-secondary border-border" /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1"><Label className="text-xs">Dia Fechamento</Label><Input type="number" min="1" max="31" value={cardForm.closingDay} onChange={(e) => setCardForm({ ...cardForm, closingDay: e.target.value })} className="bg-secondary border-border" /></div>
                    <div className="space-y-1"><Label className="text-xs">Dia Vencimento</Label><Input type="number" min="1" max="31" value={cardForm.dueDay} onChange={(e) => setCardForm({ ...cardForm, dueDay: e.target.value })} className="bg-secondary border-border" /></div>
                  </div>
                  <Button onClick={submitCard} className="w-full gradient-primary text-primary-foreground">Adicionar</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <div className="space-y-1">
            {cards.map((card, i) => (
              <div key={i} className="group flex items-center justify-between py-3 border-b border-border/50 last:border-0">
                <div>
                  <p className="text-sm font-medium">{card.name}</p>
                  <p className="text-xs text-muted-foreground">Fecha dia {card.closingDay} · Vence dia {card.dueDay}</p>
                </div>
                <div className="flex items-center gap-2">
                  <EditableValue value={card.limit} onSave={(v) => updateCard(i, { ...card, limit: v })} />
                  <button onClick={() => removeCard(i)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border bg-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Contas Fixas</h3>
            </div>
            <Dialog open={fixedOpen} onOpenChange={setFixedOpen}>
              <DialogTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7"><Plus className="h-4 w-4" /></Button></DialogTrigger>
              <DialogContent className="bg-card border-border">
                <DialogHeader><DialogTitle>Nova Conta Fixa</DialogTitle></DialogHeader>
                <div className="space-y-3 pt-2">
                  <div className="space-y-1"><Label className="text-xs">Nome</Label><Input value={fixedForm.name} onChange={(e) => setFixedForm({ ...fixedForm, name: e.target.value })} className="bg-secondary border-border" /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1"><Label className="text-xs">Dia Vencimento</Label><Input type="number" min="1" max="31" value={fixedForm.dueDay} onChange={(e) => setFixedForm({ ...fixedForm, dueDay: e.target.value })} className="bg-secondary border-border" /></div>
                    <div className="space-y-1"><Label className="text-xs">Categoria</Label><Input value={fixedForm.category} onChange={(e) => setFixedForm({ ...fixedForm, category: e.target.value })} className="bg-secondary border-border" /></div>
                  </div>
                  <div className="space-y-1"><Label className="text-xs">Valor (R$)</Label><Input type="number" step="0.01" value={fixedForm.amount} onChange={(e) => setFixedForm({ ...fixedForm, amount: e.target.value })} className="bg-secondary border-border" /></div>
                  <Button onClick={submitFixed} className="w-full gradient-primary text-primary-foreground">Adicionar</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <div className="space-y-1">
            {fixedExpenses.map((exp, i) => (
              <div key={i} className="group flex items-center justify-between py-2.5 border-b border-border/50 last:border-0">
                <div>
                  <p className="text-sm">{exp.name}</p>
                  <p className="text-xs text-muted-foreground">Dia {exp.dueDay} · {exp.category}</p>
                </div>
                <div className="flex items-center gap-2">
                  <EditableValue value={exp.amount} onSave={(v) => updateFixedExpense(i, { ...exp, amount: v })} />
                  <button onClick={() => removeFixedExpense(i)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border bg-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Categorias</h3>
            </div>
            <Dialog open={catOpen} onOpenChange={setCatOpen}>
              <DialogTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7"><Plus className="h-4 w-4" /></Button></DialogTrigger>
              <DialogContent className="bg-card border-border">
                <DialogHeader><DialogTitle>Nova Categoria</DialogTitle></DialogHeader>
                <div className="space-y-3 pt-2">
                  <div className="space-y-1"><Label className="text-xs">Nome</Label><Input value={catForm.name} onChange={(e) => setCatForm({ ...catForm, name: e.target.value })} className="bg-secondary border-border" /></div>
                  <div className="space-y-1"><Label className="text-xs">Limite (R$)</Label><Input type="number" step="0.01" value={catForm.limit} onChange={(e) => setCatForm({ ...catForm, limit: e.target.value })} className="bg-secondary border-border" /></div>
                  <Button onClick={submitCat} className="w-full gradient-primary text-primary-foreground">Adicionar</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <div className="space-y-1">
            {caixaCategory && (
              <div className="flex items-center justify-between py-2.5 border-b border-border/50">
                <div className="flex items-center gap-2 text-sm">
                  <span>{caixaCategory.name}</span>
                  <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <span className="text-mono text-sm text-primary">{formatCurrency(caixaCategory.limit)}</span>
              </div>
            )}
            {editableCategories.map((cat) => (
              <div key={cat.name} className="group flex items-center justify-between py-2.5 border-b border-border/50 last:border-0">
                <span className="text-sm">{cat.name}</span>
                <div className="flex items-center gap-2">
                  <EditableValue value={cat.limit} onSave={(v) => updateCategoryBudget(cat.index, { name: cat.name, limit: v } as CategoryBudget)} />
                  <button onClick={() => removeCategoryBudget(cat.index)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
