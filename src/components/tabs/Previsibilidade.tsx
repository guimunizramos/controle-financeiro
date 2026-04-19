import { useMemo, useState } from "react";
import { useFinance } from "@/contexts/FinanceContext";
import { formatCurrency } from "@/lib/finance-data";
import type { CategoryBudget } from "@/lib/finance-data";
import { DollarSign, Lightbulb, Tag, Trash2, Pencil, Check, X, Plus } from "lucide-react";
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

export function Previsibilidade() {
  const {
    referenceIncome,
    setReferenceIncome,
    forecastCategoryExpenses,
    addForecastCategoryExpense,
    updateForecastCategoryExpense,
    removeForecastCategoryExpense,
  } = useFinance();

  const [editingIncome, setEditingIncome] = useState(false);
  const [incomeDraft, setIncomeDraft] = useState(String(referenceIncome));
  const [catOpen, setCatOpen] = useState(false);
  const [catForm, setCatForm] = useState({ name: "", limit: "" });

  const totalPlannedExpenses = useMemo(
    () => forecastCategoryExpenses.reduce((sum, cat) => sum + cat.limit, 0),
    [forecastCategoryExpenses]
  );

  const forecastResult = referenceIncome - totalPlannedExpenses;

  const suggestion = useMemo(() => {
    if (forecastResult < 0) {
      return {
        tone: "text-destructive",
        title: "Atenção: previsão negativa",
        description: "Reduza despesas variáveis ou ajuste metas por categoria para evitar déficit no ciclo.",
      };
    }

    if (forecastResult <= referenceIncome * 0.1) {
      return {
        tone: "text-warning",
        title: "Margem apertada",
        description: "Você está no limite. Vale revisar uma ou duas categorias com maior impacto para ganhar folga.",
      };
    }

    return {
      tone: "text-primary",
      title: "Boa previsibilidade",
      description: "Sua margem está saudável. Considere reservar parte do resultado previsto para objetivos futuros.",
    };
  }, [forecastResult, referenceIncome]);

  const submitCat = () => {
    if (!catForm.name || !catForm.limit) return;
    addForecastCategoryExpense({ name: catForm.name.trim(), limit: parseFloat(catForm.limit) } as CategoryBudget);
    setCatForm({ name: "", limit: "" });
    setCatOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="rounded-xl border border-glow bg-card p-6 glow-primary">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-primary">
              <DollarSign className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Entrada Prevista</p>
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

        <div className="rounded-xl border border-border bg-card p-6">
          <p className="text-sm text-muted-foreground">Despesas Totais Previstas</p>
          <p className="text-mono text-2xl font-bold text-destructive">-{formatCurrency(totalPlannedExpenses)}</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          <p className="text-sm text-muted-foreground">Resultado Previsto</p>
          <p className={`text-mono text-2xl font-bold ${forecastResult >= 0 ? "text-primary" : "text-destructive"}`}>
            {formatCurrency(forecastResult)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl border bg-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Despesas por Categoria</h3>
            </div>
            <Dialog open={catOpen} onOpenChange={setCatOpen}>
              <DialogTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7"><Plus className="h-4 w-4" /></Button></DialogTrigger>
              <DialogContent className="bg-card border-border">
                <DialogHeader><DialogTitle>Nova Categoria Prevista</DialogTitle></DialogHeader>
                <div className="space-y-3 pt-2">
                  <div className="space-y-1"><Label className="text-xs">Nome</Label><Input value={catForm.name} onChange={(e) => setCatForm({ ...catForm, name: e.target.value })} className="bg-secondary border-border" /></div>
                  <div className="space-y-1"><Label className="text-xs">Despesa Prevista (R$)</Label><Input type="number" step="0.01" value={catForm.limit} onChange={(e) => setCatForm({ ...catForm, limit: e.target.value })} className="bg-secondary border-border" /></div>
                  <Button onClick={submitCat} className="w-full gradient-primary text-primary-foreground">Adicionar</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <div className="space-y-1">
            {forecastCategoryExpenses.length === 0 && (
              <div className="text-xs text-muted-foreground py-2">Nenhuma despesa prevista cadastrada ainda.</div>
            )}
            {forecastCategoryExpenses.map((cat, index) => (
              <div key={`${cat.name}-${index}`} className="group flex items-center justify-between py-2.5 border-b border-border/50 last:border-0">
                <span className="text-sm">{cat.name}</span>
                <div className="flex items-center gap-2">
                  <EditableValue value={cat.limit} onSave={(v) => updateForecastCategoryExpense(index, { name: cat.name, limit: v } as CategoryBudget)} />
                  <button onClick={() => removeForecastCategoryExpense(index)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border bg-card p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Lightbulb className={`h-4 w-4 ${suggestion.tone}`} />
            <h3 className="font-semibold">Sugestões de melhoria</h3>
          </div>
          <p className={`text-sm font-semibold ${suggestion.tone}`}>{suggestion.title}</p>
          <p className="text-sm text-muted-foreground">{suggestion.description}</p>
        </div>
      </div>
    </div>
  );
}
