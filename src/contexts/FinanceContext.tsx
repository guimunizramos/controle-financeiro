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
  defaultFinanceState,
  fetchFinanceState,
  saveFinanceState,
  getLegacyLocalState,
  clearLegacyLocalState,
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
  addTransaction: (tx: Omit<Transaction, "id">) => void;
  updateTransaction: (index: number, tx: Transaction) => void;
  removeTransaction: (index: number) => void;
  addInstallmentPurchase: (input: AddInstallmentPurchaseInput) => void;
  markInstallmentAsPaid: (purchaseId: string) => void;
  setReferenceIncome: (value: number) => void;
  setSelectedCycle: (cycle: string) => void;
  availableCycles: string[];
  getCardTotal: (cardName: string, cycle: string) => number;
  getCategoryTotal: (categoryName: string, cycle: string) => number;
  getAvailableCash: () => number;
}

const FinanceContext = createContext<FinanceContextType | null>(null);

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

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<FinanceState>(defaultFinanceState);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoadedFromRemote, setHasLoadedFromRemote] = useState(false);

  useEffect(() => {
    let active = true;

    const initialize = async () => {
      try {
        const dbState = await fetchFinanceState();
        if (!active) return;

        if (dbState) {
          setState(dbState);
          setHasLoadedFromRemote(true);
          return;
        }

        const legacyState = getLegacyLocalState();
        if (legacyState) {
          setState(legacyState);
          await saveFinanceState(legacyState);
          clearLegacyLocalState();
          setHasLoadedFromRemote(true);
          return;
        }

        await saveFinanceState(defaultFinanceState);
        setState(defaultFinanceState);
        setHasLoadedFromRemote(true);
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
    if (!hasLoadedFromRemote) return;
    void saveFinanceState({ ...state, categoryBudgets: state.categoryBudgets });
  }, [state, hasLoadedFromRemote]);

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
    const cycle = state.selectedCycle;
    const uniqueOwners = [...new Set(state.cards.map((card) => card.owner))];
    const totalInvoices = uniqueOwners.reduce(
      (sum, owner) =>
        sum + state.transactions.filter((t) => getCardOwnerFromLabel(t.card) === owner && t.cycle === cycle).reduce((acc, t) => acc + t.amount, 0),
      0
    );
    const totalFixed = state.fixedExpenses.reduce((sum, e) => sum + e.amount, 0);
    return state.referenceIncome - totalInvoices - totalFixed;
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
    addCard, updateCard, removeCard,
    addFixedExpense, updateFixedExpense, removeFixedExpense,
    addCategoryBudget, updateCategoryBudget, removeCategoryBudget,
    addTransaction, updateTransaction, removeTransaction,
    addInstallmentPurchase, markInstallmentAsPaid,
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
