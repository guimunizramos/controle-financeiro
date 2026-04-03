import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import type { Card, FixedExpense, CategoryBudget, Transaction } from "@/lib/finance-data";
import {
  cards as defaultCards,
  fixedExpenses as defaultFixed,
  categoryBudgets as defaultBudgets,
  transactions as defaultTransactions,
  referenceIncome as defaultIncome,
  getCurrentCycle,
} from "@/lib/finance-data";

interface FinanceState {
  cards: Card[];
  fixedExpenses: FixedExpense[];
  categoryBudgets: CategoryBudget[];
  transactions: Transaction[];
  referenceIncome: number;
}

interface FinanceContextType extends FinanceState {
  addCard: (card: Card) => void;
  updateCard: (index: number, card: Card) => void;
  removeCard: (index: number) => void;
  addFixedExpense: (expense: FixedExpense) => void;
  updateFixedExpense: (index: number, expense: FixedExpense) => void;
  removeFixedExpense: (index: number) => void;
  addCategoryBudget: (budget: CategoryBudget) => void;
  updateCategoryBudget: (index: number, budget: CategoryBudget) => void;
  removeCategoryBudget: (index: number) => void;
  addTransaction: (tx: Transaction) => void;
  updateTransaction: (index: number, tx: Transaction) => void;
  removeTransaction: (index: number) => void;
  setReferenceIncome: (value: number) => void;
  getCardTotal: (cardName: string, cycle: string) => number;
  getCategoryTotal: (categoryName: string, cycle: string) => number;
  getAvailableCash: () => number;
}

const FinanceContext = createContext<FinanceContextType | null>(null);

const STORAGE_KEY = "cycle-finance-data";
const FIXED_CATEGORY_NAME = "caixa";

function syncCaixaCategory(referenceIncome: number, categoryBudgets: CategoryBudget[]): CategoryBudget[] {
  const userCategories = categoryBudgets.filter((category) => category.name !== FIXED_CATEGORY_NAME);
  const totalUserLimits = userCategories.reduce((sum, category) => sum + category.limit, 0);
  const caixaLimit = referenceIncome - totalUserLimits;
  return [...userCategories, { name: FIXED_CATEGORY_NAME, limit: caixaLimit }];
}

function loadState(): FinanceState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as FinanceState;
      return {
        ...parsed,
        categoryBudgets: syncCaixaCategory(parsed.referenceIncome, parsed.categoryBudgets),
      };
    }
  } catch {}
  return {
    cards: defaultCards,
    fixedExpenses: defaultFixed,
    categoryBudgets: syncCaixaCategory(defaultIncome, defaultBudgets),
    transactions: defaultTransactions,
    referenceIncome: defaultIncome,
  };
}

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<FinanceState>(loadState);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

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
    if (b.name === FIXED_CATEGORY_NAME) return;
    setState((s) => ({ ...s, categoryBudgets: syncCaixaCategory(s.referenceIncome, [...s.categoryBudgets, b]) }));
  }, []);
  const updateCategoryBudget = useCallback((i: number, b: CategoryBudget) => {
    if (b.name === FIXED_CATEGORY_NAME) return;
    setState((s) => {
      if (s.categoryBudgets[i]?.name === FIXED_CATEGORY_NAME) return s;
      return {
        ...s,
        categoryBudgets: syncCaixaCategory(
          s.referenceIncome,
          s.categoryBudgets.map((x, idx) => (idx === i ? b : x))
        ),
      };
    });
  }, []);
  const removeCategoryBudget = useCallback((i: number) => {
    setState((s) => {
      if (s.categoryBudgets[i]?.name === FIXED_CATEGORY_NAME) return s;
      return {
        ...s,
        categoryBudgets: syncCaixaCategory(
          s.referenceIncome,
          s.categoryBudgets.filter((_, idx) => idx !== i)
        ),
      };
    });
  }, []);

  const addTransaction = useCallback((tx: Transaction) => {
    setState((s) => ({ ...s, transactions: [...s.transactions, tx] }));
  }, []);
  const updateTransaction = useCallback((i: number, tx: Transaction) => {
    setState((s) => ({ ...s, transactions: s.transactions.map((x, idx) => (idx === i ? tx : x)) }));
  }, []);
  const removeTransaction = useCallback((i: number) => {
    setState((s) => ({ ...s, transactions: s.transactions.filter((_, idx) => idx !== i) }));
  }, []);

  const setReferenceIncome = useCallback((value: number) => {
    setState((s) => ({
      ...s,
      referenceIncome: value,
      categoryBudgets: syncCaixaCategory(value, s.categoryBudgets),
    }));
  }, []);

  const getCardTotal = useCallback(
    (cardName: string, cycle: string) =>
      state.transactions.filter((t) => t.card === cardName && t.cycle === cycle).reduce((s, t) => s + t.amount, 0),
    [state.transactions]
  );

  const getCategoryTotal = useCallback(
    (categoryName: string, cycle: string) =>
      state.transactions.filter((t) => t.category === categoryName && t.cycle === cycle).reduce((s, t) => s + t.amount, 0),
    [state.transactions]
  );

  const getAvailableCash = useCallback(() => {
    const cycle = getCurrentCycle();
    const totalInvoices = state.cards.reduce((sum, c) => sum + state.transactions.filter((t) => t.card === c.name && t.cycle === cycle).reduce((s, t) => s + t.amount, 0), 0);
    const totalFixed = state.fixedExpenses.reduce((sum, e) => sum + e.amount, 0);
    return state.referenceIncome - totalInvoices - totalFixed;
  }, [state]);

  const value: FinanceContextType = {
    ...state,
    addCard, updateCard, removeCard,
    addFixedExpense, updateFixedExpense, removeFixedExpense,
    addCategoryBudget, updateCategoryBudget, removeCategoryBudget,
    addTransaction, updateTransaction, removeTransaction,
    setReferenceIncome,
    getCardTotal, getCategoryTotal, getAvailableCash,
  };

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
}

export function useFinance() {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error("useFinance must be inside FinanceProvider");
  return ctx;
}
