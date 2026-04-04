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
import { hasSupabaseEnv, supabase } from "@/lib/supabase";

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
const CONFIG_ID = "11111111-1111-1111-1111-111111111111";

interface ConfigurationRow {
  id: string;
  reference_income: string;
  selected_cycle: string;
  cards: Card[];
  fixed_expenses: FixedExpense[];
  category_budgets: CategoryBudget[];
}

interface TransactionRow {
  id: string;
  date: string;
  description: string;
  amount: string;
  card: string;
  category: string;
  cycle: string;
  installment_purchase_id: string | null;
}

interface InstallmentPurchaseRow {
  id: string;
  description: string;
  total_value: string;
  total_installments: number;
  paid_installments: number;
  installment_value: string;
  card_origin_id: string;
  category: string;
  first_installment_date: string;
  first_cycle: string;
  last_installment_cycle: string;
}

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
      const legacyCard = card as { name?: string; owner?: string; bank?: string; limit: number; closingDay: number; dueDay: number };
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

function fromDbRows(configuration: ConfigurationRow, rows: TransactionRow[], installmentRows: InstallmentPurchaseRow[]): FinanceState {
  return {
    cards: configuration.cards,
    fixedExpenses: configuration.fixed_expenses,
    categoryBudgets: configuration.category_budgets.filter((category) => category.name !== "Caixa"),
    transactions: rows.map((row) => ({
      id: row.id,
      date: row.date,
      description: row.description,
      amount: Number(row.amount),
      card: normalizeCardLabel(row.card),
      category: row.category,
      cycle: row.cycle,
      installmentPurchaseId: row.installment_purchase_id ?? undefined,
    })),
    installmentPurchases: installmentRows.map((row) => ({
      id: row.id,
      description: row.description,
      totalValue: Number(row.total_value),
      totalInstallments: row.total_installments,
      paidInstallments: row.paid_installments,
      installmentValue: Number(row.installment_value),
      cardOriginId: row.card_origin_id,
      category: row.category,
      firstInstallmentDate: row.first_installment_date,
      firstCycle: row.first_cycle,
      lastInstallmentCycle: row.last_installment_cycle,
    })),
    referenceIncome: Number(configuration.reference_income),
    selectedCycle: configuration.selected_cycle,
  };
}

export function getLegacyLocalState(): FinanceState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return normalizeState(JSON.parse(raw) as Partial<FinanceState>);
  } catch {
    return null;
  }
}

export function clearLegacyLocalState() {
  localStorage.removeItem(STORAGE_KEY);
}

function saveLocalState(state: FinanceState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export async function fetchFinanceState(): Promise<FinanceState | null> {
  if (!supabase || !hasSupabaseEnv) return getLegacyLocalState();

  try {
    const [configResult, transactionsResult, installmentsResult] = await Promise.all([
      supabase.from("configurations").select("*").eq("id", CONFIG_ID).maybeSingle<ConfigurationRow>(),
      supabase.from("transactions").select("*").order("date", { ascending: false }).returns<TransactionRow[]>(),
      supabase.from("installment_purchases").select("*").order("first_installment_date", { ascending: true }).returns<InstallmentPurchaseRow[]>(),
    ]);

    if (configResult.error) throw configResult.error;
    if (transactionsResult.error) throw transactionsResult.error;
    if (installmentsResult.error) throw installmentsResult.error;
    if (!configResult.data) return null;

    return fromDbRows(configResult.data, transactionsResult.data ?? [], installmentsResult.data ?? []);
  } catch (error) {
    console.error("Falha ao carregar do Supabase. Usando cache local.", error);
    return getLegacyLocalState();
  }
}

export async function saveFinanceState(state: FinanceState): Promise<void> {
  saveLocalState(state);
  if (!supabase || !hasSupabaseEnv) return;

  const cards = state.cards.map((card) => ({ ...card }));
  const fixedExpenses = state.fixedExpenses.map((expense) => ({ ...expense }));
  const categoryBudgets = state.categoryBudgets.filter((category) => category.name !== "Caixa").map((category) => ({ ...category }));

  const configurationPayload = {
    id: CONFIG_ID,
    reference_income: state.referenceIncome,
    selected_cycle: state.selectedCycle,
    cards,
    fixed_expenses: fixedExpenses,
    category_budgets: categoryBudgets,
  };

  const transactionPayload = state.transactions.map((transaction) => ({
    id: transaction.id,
    date: transaction.date,
    description: transaction.description,
    amount: transaction.amount,
    card: normalizeCardLabel(transaction.card),
    category: transaction.category,
    cycle: transaction.cycle,
    installment_purchase_id: transaction.installmentPurchaseId ?? null,
  }));

  const installmentPayload = state.installmentPurchases.map((purchase) => ({
    id: purchase.id,
    description: purchase.description,
    total_value: purchase.totalValue,
    total_installments: purchase.totalInstallments,
    paid_installments: purchase.paidInstallments,
    installment_value: purchase.installmentValue,
    card_origin_id: purchase.cardOriginId,
    category: purchase.category,
    first_installment_date: purchase.firstInstallmentDate,
    first_cycle: purchase.firstCycle,
    last_installment_cycle: purchase.lastInstallmentCycle,
  }));

  try {
    const configUpsert = await supabase.from("configurations").upsert(configurationPayload, { onConflict: "id" });
    if (configUpsert.error) throw configUpsert.error;

    const deleteTransactions = await supabase.from("transactions").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    if (deleteTransactions.error) throw deleteTransactions.error;

    const deleteInstallments = await supabase.from("installment_purchases").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    if (deleteInstallments.error) throw deleteInstallments.error;

    if (transactionPayload.length > 0) {
      const insertTransactions = await supabase.from("transactions").insert(transactionPayload);
      if (insertTransactions.error) throw insertTransactions.error;
    }

    if (installmentPayload.length > 0) {
      const insertInstallments = await supabase.from("installment_purchases").insert(installmentPayload);
      if (insertInstallments.error) throw insertInstallments.error;
    }
  } catch (error) {
    console.error("Falha ao salvar no Supabase. Dados mantidos no navegador.", error);
  }
}

export function createEntityId() {
  return createUuid();
}
