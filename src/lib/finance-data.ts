export interface Card {
  name: string;
  limit: number;
  closingDay: number;
  dueDay: number;
}

export interface FixedExpense {
  name: string;
  dueDay: number;
  category: string;
  amount: number;
}

export interface CategoryBudget {
  name: string;
  limit: number;
}

export interface Transaction {
  date: string;
  description: string;
  amount: number;
  card: string;
  category: string;
  cycle: string;
}

export const cards: Card[] = [
  { name: "Gui", limit: 5000, closingDay: 8, dueDay: 15 },
  { name: "Dani", limit: 3500, closingDay: 5, dueDay: 12 },
];

export const fixedExpenses: FixedExpense[] = [
  { name: "Aluguel", dueDay: 10, category: "Casa", amount: 1800 },
  { name: "Internet", dueDay: 15, category: "Casa", amount: 120 },
  { name: "Energia", dueDay: 20, category: "Casa", amount: 280 },
  { name: "Escola Isabelle", dueDay: 5, category: "Isabelle", amount: 950 },
  { name: "Streaming", dueDay: 12, category: "Lazer", amount: 55 },
  { name: "Seguro Carro", dueDay: 18, category: "Carro", amount: 320 },
];

export const categoryBudgets: CategoryBudget[] = [
  { name: "Alimentação", limit: 800 },
  { name: "Supermercado", limit: 1200 },
  { name: "Carro", limit: 500 },
  { name: "Lazer", limit: 400 },
  { name: "Casa", limit: 2500 },
  { name: "Gui", limit: 300 },
  { name: "Dani", limit: 300 },
  { name: "Isabelle", limit: 1000 },
];

export const referenceIncome = 9500;

export const transactions: Transaction[] = [
  { date: "2026-04-01", description: "iFood", amount: 45.9, card: "Gui", category: "Alimentação", cycle: "Abr/2026" },
  { date: "2026-04-01", description: "Supermercado Extra", amount: 287.3, card: "Dani", category: "Supermercado", cycle: "Abr/2026" },
  { date: "2026-04-02", description: "Uber", amount: 32.0, card: "Gui", category: "Carro", cycle: "Abr/2026" },
  { date: "2026-04-02", description: "Farmácia", amount: 89.5, card: "Dani", category: "Dani", cycle: "Abr/2026" },
  { date: "2026-04-02", description: "Restaurante Outback", amount: 156.0, card: "Gui", category: "Alimentação", cycle: "Abr/2026" },
  { date: "2026-04-03", description: "Gasolina", amount: 210.0, card: "Gui", category: "Carro", cycle: "Abr/2026" },
  { date: "2026-04-03", description: "Mercado Livre", amount: 129.9, card: "Gui", category: "Gui", cycle: "Abr/2026" },
  { date: "2026-03-28", description: "Cinema", amount: 65.0, card: "Dani", category: "Lazer", cycle: "Abr/2026" },
  { date: "2026-03-30", description: "Padaria", amount: 22.5, card: "Gui", category: "Alimentação", cycle: "Abr/2026" },
  { date: "2026-03-25", description: "Amazon Prime", amount: 14.9, card: "Gui", category: "Lazer", cycle: "Mar/2026" },
  { date: "2026-03-20", description: "Supermercado Pão de Açúcar", amount: 345.8, card: "Dani", category: "Supermercado", cycle: "Mar/2026" },
  { date: "2026-03-18", description: "Posto Shell", amount: 180.0, card: "Gui", category: "Carro", cycle: "Mar/2026" },
];

export function getDaysUntilClosing(card: Card): number {
  const today = new Date();
  const day = today.getDate();
  if (day <= card.closingDay) {
    return card.closingDay - day;
  }
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  return lastDay - day + card.closingDay;
}

export function getCurrentCycle(): string {
  const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  const now = new Date();
  return `${months[now.getMonth()]}/${now.getFullYear()}`;
}

export function getCardTotal(cardName: string, cycle: string): number {
  return transactions
    .filter((t) => t.card === cardName && t.cycle === cycle)
    .reduce((sum, t) => sum + t.amount, 0);
}

export function getCategoryTotal(categoryName: string, cycle: string): number {
  return transactions
    .filter((t) => t.category === categoryName && t.cycle === cycle)
    .reduce((sum, t) => sum + t.amount, 0);
}

export function getAvailableCash(): number {
  const cycle = getCurrentCycle();
  const totalInvoices = cards.reduce((sum, c) => sum + getCardTotal(c.name, cycle), 0);
  const totalFixed = fixedExpenses.reduce((sum, e) => sum + e.amount, 0);
  return referenceIncome - totalInvoices - totalFixed;
}

export function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function getStatusTag(pct: number): { label: string; color: "ok" | "warning" | "alert" } {
  if (pct < 60) return { label: "OK", color: "ok" };
  if (pct < 80) return { label: "ATENÇÃO", color: "warning" };
  return { label: "ALERTA", color: "alert" };
}
