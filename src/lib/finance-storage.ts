import {
  cards as defaultCards,
  fixedExpenses as defaultFixed,
  categoryBudgets as defaultBudgets,
  installmentPurchases as defaultInstallmentPurchases,
  referenceIncome as defaultIncome,
  transactions as defaultTransactions,
  getCurrentCycle,
  type Card,
  type CategoryBudget,
  type FixedExpense,
  type InstallmentPurchase,
  type Transaction,
} from "@/lib/finance-data";

export interface FinanceState {
  cards: Card[];
  fixedExpenses: FixedExpense[];
  categoryBudgets: CategoryBudget[];
  transactions: Transaction[];
  installmentPurchases: InstallmentPurchase[];
  referenceIncome: number;
  selectedCycle: string;
}

const STORAGE_KEY = "cycle-finance-data";

export const defaultFinanceState: FinanceState = {
  cards: defaultCards,
  fixedExpenses: defaultFixed,
  categoryBudgets: defaultBudgets,
  transactions: defaultTransactions,
  installmentPurchases: defaultInstallmentPurchases,
  referenceIncome: defaultIncome,
  selectedCycle: getCurrentCycle(),
};

function createUuid() {
  return crypto.randomUUID();
}

function normalizeCardLabel(label: string) {
  return label.includes("•") ? label : `${label} • Principal`;
}

function normalizeState(raw: Partial<FinanceState>): FinanceState {
  const installments = (raw.installmentPurchases ?? defaultInstallmentPurchases).map((purchase) => ({
    ...purchase,
    id: purchase.id.includes("-") && purchase.id.length >= 32 ? purchase.id : createUuid(),
  }));

  const purchaseIdMap = new Map<string, string>();
  (raw.installmentPurchases ?? defaultInstallmentPurchases).forEach((purchase, index) => {
    purchaseIdMap.set(purchase.id, installments[index].id);
  });

  const transactions = (raw.transactions ?? defaultTransactions).map((tx) => ({
    ...tx,
    id: tx.id.includes("-") && tx.id.length >= 32 ? tx.id : createUuid(),
    card: normalizeCardLabel(tx.card),
    installmentPurchaseId: tx.installmentPurchaseId ? purchaseIdMap.get(tx.installmentPurchaseId) : undefined,
  }));

  return {
    cards: (raw.cards ?? defaultCards).map((card) => {
      const legacyCard = card as {
        name?: string;
        owner?: string;
        bank?: string;
        limit: number;
        closingDay: number;
        dueDay: number;
      };
      return {
        owner: legacyCard.owner ?? legacyCard.name ?? "Sem nome",
        bank: legacyCard.bank ?? "Principal",
        limit: legacyCard.limit,
        closingDay: legacyCard.closingDay,
        dueDay: legacyCard.dueDay,
      };
    }),
    fixedExpenses: raw.fixedExpenses ?? defaultFixed,
    categoryBudgets: (raw.categoryBudgets ?? defaultBudgets).filter((category) => category.name !== "Caixa"),
    transactions,
    installmentPurchases: installments,
    referenceIncome: raw.referenceIncome ?? defaultIncome,
    selectedCycle: raw.selectedCycle ?? getCurrentCycle(),
  };
}

function isBrowser() {
  return typeof window !== "undefined";
}

function getLocalState(): FinanceState | null {
  if (!isBrowser()) return null;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return normalizeState(JSON.parse(raw) as Partial<FinanceState>);
  } catch {
    return null;
  }
}

function saveLocalState(state: FinanceState) {
  if (!isBrowser()) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export async function fetchFinanceState(): Promise<FinanceState | null> {
  return getLocalState();
}

export async function saveFinanceState(state: FinanceState): Promise<void> {
  saveLocalState(state);
}

export function getLegacyLocalState(): FinanceState | null {
  return getLocalState();
}

export function clearLegacyLocalState() {
  if (!isBrowser()) return;
  localStorage.removeItem(STORAGE_KEY);
}

export function createEntityId() {
  return createUuid();
}
