import { useMemo, useState } from "react";
import { useFinance } from "@/contexts/FinanceContext";
import { formatCurrency, getStatusTag } from "@/lib/finance-data";
import type { Card, CategoryBudget, FixedExpense } from "@/lib/finance-data";
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

function CardRow({
  card,
  onSave,
  onRemove,
}: {
  card: Card;
  onSave: (card: Card) => void;
  onRemove: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Card>(card);

  return (
    <div className="group rounded-lg border border-border/60 px-3 py-3 space-y-2">
      {editing ? (
        <>
          <div className="grid grid-cols-2 gap-2">
            <Input value={draft.owner} onChange={(e) => setDraft({ ...draft, owner: e.target.value })} className="bg-secondary border-border" placeholder="Nome" />
            <Input value={draft.bank} onChange={(e) => setDraft({ ...draft, bank: e.target.value })} className="bg-secondary border-border" placeholder="Banco/Cartão" />
            <Input type="number" value={draft.closingDay} onChange={(e) => setDraft({ ...draft, closingDay: Number.parseInt(e.target.value || "1", 10) })} className="bg-secondary border-border" placeholder="Fechamento" />
            <Input type="number" value={draft.dueDay} onChange={(e) => setDraft({ ...draft, dueDay: Number.parseInt(e.target.value || "1", 10) })} className="bg-secondary border-border" placeholder="Vencimento" />
            <Input type="number" value={draft.limit} onChange={(e) => setDraft({ ...draft, limit: Number.parseFloat(e.target.value || "0") })} className="bg-secondary border-border col-span-2" placeholder="Limite" />
          </div>
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={() => { setDraft(card); setEditing(false); }}>Cancelar</Button>
            <Button size="sm" onClick={() => { onSave(draft); setEditing(false); }} className="gradient-primary text-primary-foreground">Salvar</Button>
          </div>
        </>
      ) : (
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">{card.owner} · {card.bank}</p>
            <p className="text-xs text-muted-foreground">Fecha dia {card.closingDay} · Vence dia {card.dueDay}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-mono text-sm text-primary">{formatCurrency(card.limit)}</span>
            <button onClick={() => setEditing(true)} className="text-muted-foreground hover:text-foreground"><Pencil className="h-3.5 w-3.5" /></button>
            <button onClick={onRemove} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"><Trash2 className="h-3.5 w-3.5" /></button>
          </div>
        </div>
      )}
    </div>
  );
}

function FixedExpenseRow({
  expense,
  onSave,
  onRemove,
}: {
  expense: FixedExpense;
  onSave: (expense: FixedExpense) => void;
  onRemove: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<FixedExpense>(expense);

  return (
    <div className="group rounded-lg border border-border/60 px-3 py-3 space-y-2">
      {editing ? (
        <>
          <div className="grid grid-cols-2 gap-2">
            <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className="bg-secondary border-border col-span-2" placeholder="Nome" />
            <Input type="number" value={draft.dueDay} onChange={(e) => setDraft({ ...draft, dueDay: Number.parseInt(e.target.value || "1", 10) })} className="bg-secondary border-border" placeholder="Vencimento" />
            <Input value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })} className="bg-secondary border-border" placeholder="Categoria" />
            <Input type="number" value={draft.amount} onChange={(e) => setDraft({ ...draft, amount: Number.parseFloat(e.target.value || "0") })} className="bg-secondary border-border col-span-2" placeholder="Valor" />
          </div>
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={() => { setDraft(expense); setEditing(false); }}>Cancelar</Button>
            <Button size="sm" onClick={() => { onSave(draft); setEditing(false); }} className="gradient-primary text-primary-foreground">Salvar</Button>
          </div>
        </>
      ) : (
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm">{expense.name}</p>
            <p className="text-xs text-muted-foreground">Dia {expense.dueDay} · {expense.category}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-mono text-sm text-primary">{formatCurrency(expense.amount)}</span>
            <button onClick={() => setEditing(true)} className="text-muted-foreground hover:text-foreground"><Pencil className="h-3.5 w-3.5" /></button>
            <button onClick={onRemove} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"><Trash2 className="h-3.5 w-3.5" /></button>
          </div>
        </div>
      )}
    </div>
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
  const [cardForm, setCardForm] = useState({ owner: "", bank: "", limit: "", closingDay: "", dueDay: "" });
  const [fixedOpen, setFixedOpen] = useState(false);
  const [fixedForm, setFixedForm] = useState({ name: "", dueDay: "", category: "", amount: "" });
  const [catOpen, setCatOpen] = useState(false);
  const [catForm, setCatForm] = useState({ name: "", limit: "" });

  const submitCard = () => {
    if (!cardForm.owner || !cardForm.bank || !cardForm.limit) return;
    addCard({
      owner: cardForm.owner.trim(),
      bank: cardForm.bank.trim(),
      limit: parseFloat(cardForm.limit),
      closingDay: parseInt(cardForm.closingDay) || 1,
      dueDay: parseInt(cardForm.dueDay) || 1,
    });
    setCardForm({ owner: "", bank: "", limit: "", closingDay: "", dueDay: "" });
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
  const caixaStatus = getStatusTag(caixaCategory && referenceIncome > 0 ? (caixaCategory.limit / referenceIncome) * 100 : 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-glow bg-card p-6 glow-primary">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-primary">
              <DollarSign className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Valor de Referência</p>
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

        <div className="rounded-xl border border-border bg-card p-6 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-primary" />
              <h3 className="font-semibold">Categoria Caixa</h3>
            </div>
            <span className="inline-flex items-center rounded-full bg-primary/15 text-primary px-2 py-1 text-xs font-semibold">
              {caixaStatus.label}
            </span>
          </div>
          <p className="text-mono text-2xl font-bold text-primary">{formatCurrency(caixaCategory?.limit ?? 0)}</p>
          <p className="text-xs text-muted-foreground">Valor automático, calculado com base na renda de referência e limites das categorias.</p>
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
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1"><Label className="text-xs">Nome</Label><Input value={cardForm.owner} onChange={(e) => setCardForm({ ...cardForm, owner: e.target.value })} className="bg-secondary border-border" /></div>
                    <div className="space-y-1"><Label className="text-xs">Banco/Cartão</Label><Input value={cardForm.bank} onChange={(e) => setCardForm({ ...cardForm, bank: e.target.value })} className="bg-secondary border-border" /></div>
                  </div>
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
          <div className="space-y-2">
            {cards.map((card, i) => (
              <CardRow key={`${card.owner}-${card.bank}-${i}`} card={card} onSave={(next) => updateCard(i, next)} onRemove={() => removeCard(i)} />
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
          <div className="space-y-2">
            {fixedExpenses.map((expense, i) => (
              <FixedExpenseRow key={`${expense.name}-${i}`} expense={expense} onSave={(next) => updateFixedExpense(i, next)} onRemove={() => removeFixedExpense(i)} />
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
