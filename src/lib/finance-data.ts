export interface Card {
  owner: string;
  bank: string;
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
  isFixed?: boolean;
}

export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  card: string;
  category: string;
  cycle: string;
  installmentPurchaseId?: string;
}

export interface InstallmentPurchase {
  id: string;
  description: string;
  totalValue: number;
  totalInstallments: number;
  paidInstallments: number;
  installmentValue: number;
  cardOriginId: string;
  category: string;
  firstInstallmentDate: string;
  firstCycle: string;
  lastInstallmentCycle: string;
}

export const MONTHS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
export const MONTH_INDEX: Record<string, number> = {
  Jan: 0, Fev: 1, Mar: 2, Abr: 3, Mai: 4, Jun: 5,
  Jul: 6, Ago: 7, Set: 8, Out: 9, Nov: 10, Dez: 11,
};

export function getCycleFromDate(dateInput: string | Date): string {
  const date = typeof dateInput === "string" ? new Date(`${dateInput}T00:00:00`) : dateInput;
  return `${MONTHS[date.getMonth()]}/${date.getFullYear()}`;
}

export function addMonthsToCycle(baseCycle: string, monthsToAdd: number): string {
  const [monthLabel, yearLabel] = baseCycle.split("/");
  const month = MONTH_INDEX[monthLabel] ?? 0;
  const year = Number.parseInt(yearLabel ?? "0", 10);
  const date = new Date(year, month + monthsToAdd, 1);
  return `${MONTHS[date.getMonth()]}/${date.getFullYear()}`;
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

export const cards: Card[] = [
  { owner: "Gui", bank: "Principal", limit: 5000, closingDay: 8, dueDay: 15 },
  { owner: "Dani", bank: "Principal", limit: 3500, closingDay: 5, dueDay: 12 },
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
  { id: "tx-1", date: "2026-04-01", description: "iFood", amount: 45.9, card: "Gui • Principal", category: "Alimentação", cycle: "Abr/2026" },
  { id: "tx-2", date: "2026-04-01", description: "Supermercado Extra", amount: 287.3, card: "Dani • Principal", category: "Supermercado", cycle: "Abr/2026" },
  { id: "tx-3", date: "2026-04-02", description: "Uber", amount: 32.0, card: "Gui • Principal", category: "Carro", cycle: "Abr/2026" },
  { id: "tx-4", date: "2026-04-02", description: "Farmácia", amount: 89.5, card: "Dani • Principal", category: "Dani", cycle: "Abr/2026" },
  { id: "tx-5", date: "2026-04-02", description: "Restaurante Outback", amount: 156.0, card: "Gui • Principal", category: "Alimentação", cycle: "Abr/2026" },
  { id: "tx-6", date: "2026-04-03", description: "Gasolina", amount: 210.0, card: "Gui • Principal", category: "Carro", cycle: "Abr/2026" },
  { id: "tx-7", date: "2026-04-03", description: "Mercado Livre", amount: 129.9, card: "Gui • Principal", category: "Gui", cycle: "Abr/2026" },
  { id: "tx-8", date: "2026-03-28", description: "Cinema", amount: 65.0, card: "Dani • Principal", category: "Lazer", cycle: "Abr/2026" },
  { id: "tx-9", date: "2026-03-30", description: "Padaria", amount: 22.5, card: "Gui • Principal", category: "Alimentação", cycle: "Abr/2026" },
  { id: "tx-10", date: "2026-03-25", description: "Amazon Prime", amount: 14.9, card: "Gui • Principal", category: "Lazer", cycle: "Mar/2026" },
  { id: "tx-11", date: "2026-03-20", description: "Supermercado Pão de Açúcar", amount: 345.8, card: "Dani • Principal", category: "Supermercado", cycle: "Mar/2026" },
  { id: "tx-12", date: "2026-03-18", description: "Posto Shell", amount: 180.0, card: "Gui • Principal", category: "Carro", cycle: "Mar/2026" },
];

export const installmentPurchases: InstallmentPurchase[] = [];

export function getDaysUntilClosing(card: Card): number {
  const today = new Date();
  const day = today.getDate();
  if (day <= card.closingDay) {
    return card.closingDay - day;
  }
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  return lastDay - day + card.closingDay;
}

export function getCardLabel(card: Card): string {
  return `${card.owner} • ${card.bank}`;
}

export function getCardOwnerFromLabel(label: string): string {
  return label.split("•")[0]?.trim() ?? label;
}

export function getCurrentCycle(): string {
  const now = new Date();
  return `${MONTHS[now.getMonth()]}/${now.getFullYear()}`;
}

export function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function getStatusTag(pct: number): { label: string; color: "ok" | "warning" | "alert" } {
  if (pct < 60) return { label: "OK", color: "ok" };
  if (pct < 80) return { label: "ATENÇÃO", color: "warning" };
  return { label: "ALERTA", color: "alert" };
}
