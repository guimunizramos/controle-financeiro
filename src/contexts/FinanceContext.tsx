import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from "react";
import type { Card, FixedExpense, CategoryBudget, Transaction, InstallmentPurchase } from "@/lib/finance-data";
import {
  getCurrentCycle,
  addMonthsToCycle,
  getCycleFromDate,
  splitAmountIntoInstallments,
  getCardOwnerFromLabel,
} from "@/lib/finance-data";
import {
  createEntityId,
  createEntry,
  defaultFinanceState,
  fetchEntries,
  fetchFinanceState,
  saveFinanceState,
  getLegacyLocalState,
  clearLegacyLocalState,
  removeEntry as removeEntryFromStorage,
  type Entry,
  type FinanceState,
} from "@/lib/finance-storage";

interface AddInstallmentPurchaseInput {
  description: string;
  totalValue: number;
  totalInstallments: number;
  cardOriginId: string;
  category: string;
  firstInstallmentDate: string;
}

interface UpdateInstallmentPurchaseInput extends AddInstallmentPurchaseInput {
  id: string;
}

interface FinanceContextType extends FinanceState {
  isLoading: boolean;
  addCard: (card: Card) => void;
  updateCard: (index: number, card: Card) => void;
  removeCard: (index: number) => void;
  addFixedExpense: (expense: FixedExpense) => void;
  updateFixedExpense: (index: number, expense: FixedExpense) => void;
  removeFixedExpense: (index: number) => void;
  addCategoryBudget: (budget: CategoryBudget) => void;
  updateCategoryBudget: (index: number, budget: CategoryBudget) => void;
  removeCategoryBudget: (index: number) => void;
  addForecastCategoryExpense: (budget: CategoryBudget) => void;
  updateForecastCategoryExpense: (index: number, budget: CategoryBudget) => void;
  removeForecastCategoryExpense: (index: number) => void;
  forecastCategoryExpenses: CategoryBudget[];
  addTransaction: (tx: Omit<Transaction, "id">) => void;
  updateTransaction: (index: number, tx: Transaction) => void;
  removeTransaction: (index: number) => void;
  addInstallmentPurchase: (input: AddInstallmentPurchaseInput) => void;
  updateInstallmentPurchase: (input: UpdateInstallmentPurchaseInput) => void;
  markInstallmentAsPaid: (purchaseId: string) => void;
  addEntry: (entry: Entry) => Promise<Entry>;
  removeEntry: (id: number) => Promise<void>;
  setReferenceIncome: (value: number) => void;
  setSelectedCycle: (cycle: string) => void;
  availableCycles: string[];
  getCardTotal: (cardName: string, cycle: string) => number;
  getCategoryTotal: (categoryName: string, cycle: string) => number;
  getAvailableCash: () => number;
}

const FinanceContext = createContext<FinanceContextType | null>(null);
const FORECAST_CATEGORY_STORAGE_KEY = "forecast-category-expenses-v1";

const MONTH_INDEX: Record<string, number> = {
  Jan: 0, Fev: 1, Mar: 2, Abr: 3, Mai: 4, Jun: 5,
  Jul: 6, Ago: 7, Set: 8, Out: 9, Nov: 10, Dez: 11,
};

function cycleToKey(cycle: string): number {
  const [monthLabel, yearLabel] = cycle.split("/");
  const month = MONTH_INDEX[monthLabel] ?? 0;
  const year = Number.parseInt(yearLabel ?? "0", 10);
  return year * 12 + month;
}

function parseForecastCategoryExpenses(raw: string | null): CategoryBudget[] {
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as Array<{ name?: string; limit?: number }>;
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((item) => ({
        name: String(item.name ?? "").trim(),
        limit: Number(item.limit ?? 0),
      }))
      .filter((item) => item.name.length > 0);
  } catch {
    return [];
  }
}

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<FinanceState>(defaultFinanceState);
  const [forecastCategoryExpenses, setForecastCategoryExpenses] = useState<CategoryBudget[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasInitializedStorage, setHasInitializedStorage] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const parsed = parseForecastCategoryExpenses(window.localStorage.getItem(FORECAST_CATEGORY_STORAGE_KEY));
    setForecastCategoryExpenses(parsed);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(FORECAST_CATEGORY_STORAGE_KEY, JSON.stringify(forecastCategoryExpenses));
  }, [forecastCategoryExpenses]);

  useEffect(() => {
    let active = true;

    const initialize = async () => {
      try {
        const dbState = await fetchFinanceState();
        const entries = await fetchEntries();
        if (!active) return;

        if (dbState) {
          setState({ ...dbState, entries });
          setHasInitializedStorage(true);
          return;
        }

        const legacyState = getLegacyLocalState();
        if (legacyState) {
          setState({ ...legacyState, entries });
          await saveFinanceState(legacyState);
          clearLegacyLocalState();
          setHasInitializedStorage(true);
          return;
        }

        await saveFinanceState(defaultFinanceState);
        setState({ ...defaultFinanceState, entries });
        setHasInitializedStorage(true);
      } catch (error) {
        console.error("Erro ao carregar dados financeiros:", error);
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    void initialize();

    return () => {
      active = false;
    };
  }, []);

  const categoryBudgets = useMemo(() => {
    const sumBudgets = state.categoryBudgets.reduce((sum, cat) => sum + cat.limit, 0);
    const caixaValue = Math.max(state.referenceIncome - sumBudgets, 0);
    return [{ name: "Caixa", limit: caixaValue, isFixed: true }, ...state.categoryBudgets];
  }, [state.categoryBudgets, state.referenceIncome]);

  useEffect(() => {
    if (!hasInitializedStorage) return;
    void saveFinanceState({ ...state, categoryBudgets: state.categoryBudgets });
  }, [state, hasInitializedStorage]);

  const addCard = useCallback((card: Card) => {
    setState((s) => ({ ...s, cards: [...s.cards, card] }));
  }, []);
  const updateCard = useCallback((i: number, card: Card) => {
    setState((s) => ({ ...s, cards: s.cards.map((c, idx) => (idx === i ? card : c)) }));
  }, []);
  const removeCard = useCallback((i: number) => {
    setState((s) => ({ ...s, cards: s.cards.filter((_, idx) => idx !== i) }));
  }, []);

  const addFixedExpense = useCallback((e: FixedExpense) => {
    setState((s) => ({ ...s, fixedExpenses: [...s.fixedExpenses, e] }));
  }, []);
  const updateFixedExpense = useCallback((i: number, e: FixedExpense) => {
    setState((s) => ({ ...s, fixedExpenses: s.fixedExpenses.map((x, idx) => (idx === i ? e : x)) }));
  }, []);
  const removeFixedExpense = useCallback((i: number) => {
    setState((s) => ({ ...s, fixedExpenses: s.fixedExpenses.filter((_, idx) => idx !== i) }));
  }, []);

  const addCategoryBudget = useCallback((b: CategoryBudget) => {
    if (b.name.trim().toLowerCase() === "caixa") return;
    setState((s) => ({ ...s, categoryBudgets: [...s.categoryBudgets, b] }));
  }, []);
  const updateCategoryBudget = useCallback((i: number, b: CategoryBudget) => {
    setState((s) => ({ ...s, categoryBudgets: s.categoryBudgets.map((x, idx) => (idx === i ? b : x)) }));
  }, []);
  const removeCategoryBudget = useCallback((i: number) => {
    setState((s) => ({ ...s, categoryBudgets: s.categoryBudgets.filter((_, idx) => idx !== i) }));
  }, []);

  const addForecastCategoryExpense = useCallback((b: CategoryBudget) => {
    setForecastCategoryExpenses((current) => [...current, { name: b.name, limit: b.limit }]);
  }, []);

  const updateForecastCategoryExpense = useCallback((i: number, b: CategoryBudget) => {
    setForecastCategoryExpenses((current) => current.map((item, idx) => (idx === i ? { name: b.name, limit: b.limit } : item)));
  }, []);

  const removeForecastCategoryExpense = useCallback((i: number) => {
    setForecastCategoryExpenses((current) => current.filter((_, idx) => idx !== i));
  }, []);

  const addTransaction = useCallback((tx: Omit<Transaction, "id">) => {
    setState((s) => ({ ...s, transactions: [...s.transactions, { ...tx, id: createEntityId() }] }));
  }, []);
  const updateTransaction = useCallback((i: number, tx: Transaction) => {
    setState((s) => ({ ...s, transactions: s.transactions.map((x, idx) => (idx === i ? tx : x)) }));
  }, []);
  const removeTransaction = useCallback((i: number) => {
    setState((s) => ({ ...s, transactions: s.transactions.filter((_, idx) => idx !== i) }));
  }, []);

  const addInstallmentPurchase = useCallback((input: AddInstallmentPurchaseInput) => {
    setState((s) => {
      const installmentValues = splitAmountIntoInstallments(input.totalValue, input.totalInstallments);
      const firstCycle = getCycleFromDate(input.firstInstallmentDate);
      const purchaseId = createEntityId();

      const generatedTransactions: Transaction[] = installmentValues.map((value, index) => ({
        id: createEntityId(),
        date: input.firstInstallmentDate,
        description: `${input.description} (${index + 1}/${input.totalInstallments})`,
        amount: value,
        card: input.cardOriginId,
        category: input.category,
        cycle: addMonthsToCycle(firstCycle, index),
        installmentPurchaseId: purchaseId,
      }));

      const purchase: InstallmentPurchase = {
        id: purchaseId,
        description: input.description,
        totalValue: input.totalValue,
        totalInstallments: input.totalInstallments,
        paidInstallments: 0,
        installmentValue: input.totalValue / input.totalInstallments,
        cardOriginId: input.cardOriginId,
        category: input.category,
        firstInstallmentDate: input.firstInstallmentDate,
        firstCycle,
        lastInstallmentCycle: addMonthsToCycle(firstCycle, input.totalInstallments - 1),
      };

      return {
        ...s,
        installmentPurchases: [...s.installmentPurchases, purchase],
        transactions: [...s.transactions, ...generatedTransactions],
      };
    });
  }, []);

  const updateInstallmentPurchase = useCallback((input: UpdateInstallmentPurchaseInput) => {
    setState((s) => {
      const purchase = s.installmentPurchases.find((item) => item.id === input.id);
      if (!purchase) return s;

      const firstCycle = getCycleFromDate(input.firstInstallmentDate);
      const installmentValues = splitAmountIntoInstallments(input.totalValue, input.totalInstallments);
      const paidInstallments = Math.min(purchase.paidInstallments, input.totalInstallments);

      const regeneratedTransactions: Transaction[] = installmentValues.map((value, index) => ({
        id: createEntityId(),
        date: input.firstInstallmentDate,
        description: `${input.description} (${index + 1}/${input.totalInstallments})`,
        amount: value,
        card: input.cardOriginId,
        category: input.category,
        cycle: addMonthsToCycle(firstCycle, index),
        installmentPurchaseId: input.id,
      }));

      return {
        ...s,
        installmentPurchases: s.installmentPurchases.map((item) => {
          if (item.id !== input.id) return item;
          return {
            ...item,
            description: input.description,
            totalValue: input.totalValue,
            totalInstallments: input.totalInstallments,
            paidInstallments,
            installmentValue: input.totalValue / input.totalInstallments,
            cardOriginId: input.cardOriginId,
            category: input.category,
            firstInstallmentDate: input.firstInstallmentDate,
            firstCycle,
            lastInstallmentCycle: addMonthsToCycle(firstCycle, input.totalInstallments - 1),
          };
        }),
        transactions: [
          ...s.transactions.filter((tx) => tx.installmentPurchaseId !== input.id),
          ...regeneratedTransactions,
        ],
      };
    });
  }, []);

  const markInstallmentAsPaid = useCallback((purchaseId: string) => {
    setState((s) => ({
      ...s,
      installmentPurchases: s.installmentPurchases.map((purchase) => {
        if (purchase.id !== purchaseId) return purchase;
        return {
          ...purchase,
          paidInstallments: Math.min(purchase.totalInstallments, purchase.paidInstallments + 1),
        };
      }),
    }));
  }, []);

  const addEntry = useCallback(async (entry: Entry): Promise<Entry> => {
    const created = await createEntry(entry);
    setState((s) => ({ ...s, entries: [created, ...s.entries] }));
    return created;
  }, []);

  const removeEntry = useCallback(async (id: number): Promise<void> => {
    await removeEntryFromStorage(id);
    setState((s) => ({ ...s, entries: s.entries.filter((entry) => entry.id !== id) }));
  }, []);

  const setReferenceIncome = useCallback((value: number) => {
    setState((s) => ({ ...s, referenceIncome: value }));
  }, []);
  const setSelectedCycle = useCallback((cycle: string) => {
    setState((s) => ({ ...s, selectedCycle: cycle }));
  }, []);

  const getCardTotal = useCallback(
    (cardOwner: string, cycle: string) =>
      state.transactions
        .filter((t) => getCardOwnerFromLabel(t.card) === cardOwner && t.cycle === cycle)
        .reduce((s, t) => s + t.amount, 0),
    [state.transactions]
  );

  const getCategoryTotal = useCallback(
    (categoryName: string, cycle: string) =>
      state.transactions.filter((t) => t.category === categoryName && t.cycle === cycle).reduce((s, t) => s + t.amount, 0),
    [state.transactions]
  );

  const getAvailableCash = useCallback(() => {
    const totalIncome = state.entries.filter((entry) => entry.type === "income").reduce((sum, entry) => sum + Number(entry.amount), 0);
    const totalOut = state.entries.filter((entry) => entry.type !== "income").reduce((sum, entry) => sum + Number(entry.amount), 0);
    return totalIncome - totalOut;
  }, [state]);

  const availableCycles = [...new Set([...state.transactions.map((tx) => tx.cycle), getCurrentCycle()])]
    .sort((a, b) => cycleToKey(b) - cycleToKey(a));

  useEffect(() => {
    if (availableCycles.length === 0) return;
    if (!availableCycles.includes(state.selectedCycle)) {
      setState((s) => ({ ...s, selectedCycle: availableCycles[0] }));
    }
  }, [availableCycles, state.selectedCycle]);

  const value: FinanceContextType = {
    ...state,
    isLoading,
    categoryBudgets,
    forecastCategoryExpenses,
    addCard, updateCard, removeCard,
    addFixedExpense, updateFixedExpense, removeFixedExpense,
    addCategoryBudget, updateCategoryBudget, removeCategoryBudget,
    addForecastCategoryExpense, updateForecastCategoryExpense, removeForecastCategoryExpense,
    addTransaction, updateTransaction, removeTransaction,
    addInstallmentPurchase, updateInstallmentPurchase, markInstallmentAsPaid,
    addEntry, removeEntry,
    setReferenceIncome, setSelectedCycle,
    availableCycles,
    getCardTotal, getCategoryTotal, getAvailableCash,
  };

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
}

export function useFinance() {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error("useFinance must be inside FinanceProvider");
  return ctx;
}
