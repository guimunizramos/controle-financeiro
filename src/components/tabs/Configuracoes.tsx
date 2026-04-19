import { useMemo, useState } from "react";
import { useFinance } from "@/contexts/FinanceContext";
import { formatCurrency } from "@/lib/finance-data";
import type { Card, CategoryBudget, FixedExpense } from "@/lib/finance-data";
import { CreditCard, CalendarClock, Tag, Plus, Trash2, Pencil, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

function EditableValue({ value, onSave }: { value: number; onSave: (v: number) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));
  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <span className="text-xs text-muted-foreground">Limite: </span>
        <Input
          type="number"
          className="h-7 w-24 bg-secondary border-border text-xs"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              onSave(parseFloat(draft) || 0);
              setEditing(false);
            }
          }}
        />
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

function CardRow({ card, onSave, onRemove }: { card: Card; onSave: (card: Card) => void; onRemove: () => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Card>(card);

  return (
    <div className="group rounded-lg border border-border/60 px-3 py-3 space-y-2">
      {editing ? (
        <>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Nome</Label>
              <Select value={draft.owner} onValueChange={(value) => setDraft({ ...draft, owner: value })}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="Gui">Gui</SelectItem>
                  <SelectItem value="Dani">Dani</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Banco/Cartão</Label>
              <Input value={draft.bank} onChange={(e) => setDraft({ ...draft, bank: e.target.value })} className="bg-secondary border-border" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Dia Fechamento</Label>
              <Input type="number" value={draft.closingDay} onChange={(e) => setDraft({ ...draft, closingDay: Number.parseInt(e.target.value || "1", 10) })} className="bg-secondary border-border" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Dia Vencimento</Label>
              <Input type="number" value={draft.dueDay} onChange={(e) => setDraft({ ...draft, dueDay: Number.parseInt(e.target.value || "1", 10) })} className="bg-secondary border-border" />
            </div>
            <div className="space-y-1 col-span-2">
              <Label className="text-xs">Limite (R$)</Label>
              <Input type="number" value={draft.limit} onChange={(e) => setDraft({ ...draft, limit: Number.parseFloat(e.target.value || "0") })} className="bg-secondary border-border" />
            </div>
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

function FixedExpenseRow({ expense, onSave, onRemove }: { expense: FixedExpense; onSave: (expense: FixedExpense) => void; onRemove: () => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<FixedExpense>(expense);

  return (
    <div className="group rounded-lg border border-border/60 px-3 py-3 space-y-2">
      {editing ? (
        <>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1 col-span-2">
              <Label className="text-xs">Nome</Label>
              <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className="bg-secondary border-border" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Dia Vencimento</Label>
              <Input type="number" value={draft.dueDay} onChange={(e) => setDraft({ ...draft, dueDay: Number.parseInt(e.target.value || "1", 10) })} className="bg-secondary border-border" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Categoria</Label>
              <Input value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })} className="bg-secondary border-border" />
            </div>
            <div className="space-y-1 col-span-2">
              <Label className="text-xs">Valor (R$)</Label>
              <Input type="number" value={draft.amount} onChange={(e) => setDraft({ ...draft, amount: Number.parseFloat(e.target.value || "0") })} className="bg-secondary border-border" />
            </div>
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
    cards, addCard, updateCard, removeCard,
    fixedExpenses, addFixedExpense, updateFixedExpense, removeFixedExpense,
    categoryBudgets, addCategoryBudget, updateCategoryBudget, removeCategoryBudget,
  } = useFinance();

  const editableCategories = useMemo(
    () => categoryBudgets.filter((cat) => !cat.isFixed).map((cat, index) => ({ ...cat, index })),
    [categoryBudgets]
  );

  const [cardOpen, setCardOpen] = useState(false);
  const [cardForm, setCardForm] = useState({ owner: "Gui", bank: "", limit: "", closingDay: "", dueDay: "" });
  const [fixedOpen, setFixedOpen] = useState(false);
  const [fixedForm, setFixedForm] = useState({ name: "", dueDay: "", category: "", amount: "" });
  const [catOpen, setCatOpen] = useState(false);
  const [catForm, setCatForm] = useState({ name: "", limit: "" });

  const submitCard = () => {
    if (!cardForm.owner || !cardForm.bank || !cardForm.limit) return;
    addCard({ owner: cardForm.owner.trim(), bank: cardForm.bank.trim(), limit: parseFloat(cardForm.limit), closingDay: parseInt(cardForm.closingDay) || 1, dueDay: parseInt(cardForm.dueDay) || 1 });
    setCardForm({ owner: "Gui", bank: "", limit: "", closingDay: "", dueDay: "" });
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

  return (
    <div className="space-y-6">
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
                    <div className="space-y-1">
                      <Label className="text-xs">Nome</Label>
                      <Select value={cardForm.owner} onValueChange={(value) => setCardForm({ ...cardForm, owner: value })}>
                        <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Selecione" /></SelectTrigger>
                        <SelectContent className="bg-card border-border"><SelectItem value="Gui">Gui</SelectItem><SelectItem value="Dani">Dani</SelectItem></SelectContent>
                      </Select>
                    </div>
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
