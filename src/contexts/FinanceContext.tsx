import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import type {
  Card,
  FixedExpense,
  CategoryBudget,
  Transaction,
  InstallmentPurchase,
  InstallmentPurchaseInput,
} from "@/lib/finance-data";
import {
  cards as defaultCards,
  fixedExpenses as defaultFixed,
  categoryBudgets as defaultBudgets,
  transactions as defaultTransactions,
  installmentPurchases as defaultInstallmentPurchases,
  referenceIncome as defaultIncome,
  createInstallmentBundle,
  getCurrentCycle,
} from "@/lib/finance-data";

interface FinanceState {
  cards: Card[];
  fixedExpenses: FixedExpense[];
  categoryBudgets: CategoryBudget[];
  transactions: Transaction[];
  installmentPurchases: InstallmentPurchase[];
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
  addTransaction: (tx: Omit<Transaction, "id"> | Transaction) => void;
  updateTransaction: (index: number, tx: Transaction) => void;
  removeTransaction: (index: number) => void;
  addInstallmentPurchase: (input: InstallmentPurchaseInput) => void;
  markInstallmentAsPaid: (purchaseId: string) => void;
  setReferenceIncome: (value: number) => void;
  getCardTotal: (cardName: string, cycle: string) => number;
  getCategoryTotal: (categoryName: string, cycle: string) => number;
  getAvailableCash: () => number;
}

const FinanceContext = createContext<FinanceContextType | null>(null);

const STORAGE_KEY = "cycle-finance-data";

function loadState(): FinanceState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        cards: parsed.cards ?? defaultCards,
        fixedExpenses: parsed.fixedExpenses ?? defaultFixed,
        categoryBudgets: parsed.categoryBudgets ?? defaultBudgets,
        transactions: parsed.transactions ?? defaultTransactions,
        installmentPurchases: parsed.installmentPurchases ?? defaultInstallmentPurchases,
        referenceIncome: parsed.referenceIncome ?? defaultIncome,
      };
    }
  } catch {
    // fallback for invalid payload
  }

  return {
    cards: defaultCards,
    fixedExpenses: defaultFixed,
    categoryBudgets: defaultBudgets,
    transactions: defaultTransactions,
    installmentPurchases: defaultInstallmentPurchases,
    referenceIncome: defaultIncome,
  };
}

function withTransactionId(tx: Omit<Transaction, "id"> | Transaction): Transaction {
  if ("id" in tx && tx.id) return tx;
  return { ...tx, id: `tx-${Date.now()}-${Math.random().toString(36).slice(2, 8)}` };
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
    setState((s) => ({ ...s, categoryBudgets: [...s.categoryBudgets, b] }));
  }, []);
  const updateCategoryBudget = useCallback((i: number, b: CategoryBudget) => {
    setState((s) => ({ ...s, categoryBudgets: s.categoryBudgets.map((x, idx) => (idx === i ? b : x)) }));
  }, []);
  const removeCategoryBudget = useCallback((i: number) => {
    setState((s) => ({ ...s, categoryBudgets: s.categoryBudgets.filter((_, idx) => idx !== i) }));
  }, []);

  const addTransaction = useCallback((tx: Omit<Transaction, "id"> | Transaction) => {
    setState((s) => ({ ...s, transactions: [...s.transactions, withTransactionId(tx)] }));
  }, []);
  const updateTransaction = useCallback((i: number, tx: Transaction) => {
    setState((s) => ({ ...s, transactions: s.transactions.map((x, idx) => (idx === i ? tx : x)) }));
  }, []);
  const removeTransaction = useCallback((i: number) => {
    setState((s) => ({ ...s, transactions: s.transactions.filter((_, idx) => idx !== i) }));
  }, []);

  const addInstallmentPurchase = useCallback((input: InstallmentPurchaseInput) => {
    setState((s) => {
      const { purchase, generatedTransactions } = createInstallmentBundle(input, s.cards);
      return {
        ...s,
        installmentPurchases: [...s.installmentPurchases, purchase],
        transactions: [...s.transactions, ...generatedTransactions],
      };
    });
  }, []);

  const markInstallmentAsPaid = useCallback((purchaseId: string) => {
    setState((s) => {
      const targetPurchase = s.installmentPurchases.find((purchase) => purchase.id === purchaseId);
      if (!targetPurchase || targetPurchase.paidInstallments >= targetPurchase.totalInstallments) {
        return s;
      }

      const pendingInstallments = s.transactions
        .filter((tx) => tx.installmentPurchaseId === purchaseId && !tx.isPaid)
        .sort((a, b) => (a.installmentNumber ?? 0) - (b.installmentNumber ?? 0));

      const nextPending = pendingInstallments[0];
      if (!nextPending) return s;

      const nextTransactions = s.transactions.map((tx) =>
        tx.id === nextPending.id ? { ...tx, isPaid: true } : tx
      );

      const followingPending = pendingInstallments[1];

      const nextPurchases = s.installmentPurchases.map((purchase) => {
        if (purchase.id !== purchaseId) return purchase;
        const paidInstallments = Math.min(purchase.paidInstallments + 1, purchase.totalInstallments);

        return {
          ...purchase,
          paidInstallments,
          nextInstallmentCycle: followingPending?.cycle ?? "Quitado",
        };
      });

      return {
        ...s,
        transactions: nextTransactions,
        installmentPurchases: nextPurchases,
      };
    });
  }, []);

  const setReferenceIncome = useCallback((value: number) => {
    setState((s) => ({ ...s, referenceIncome: value }));
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
    const totalInvoices = state.cards.reduce(
      (sum, c) =>
        sum + state.transactions.filter((t) => t.card === c.name && t.cycle === cycle).reduce((acc, t) => acc + t.amount, 0),
      0
    );
    const totalFixed = state.fixedExpenses.reduce((sum, e) => sum + e.amount, 0);
    return state.referenceIncome - totalInvoices - totalFixed;
  }, [state]);

  const value: FinanceContextType = {
    ...state,
    addCard,
    updateCard,
    removeCard,
    addFixedExpense,
    updateFixedExpense,
    removeFixedExpense,
    addCategoryBudget,
    updateCategoryBudget,
    removeCategoryBudget,
    addTransaction,
    updateTransaction,
    removeTransaction,
    addInstallmentPurchase,
    markInstallmentAsPaid,
    setReferenceIncome,
    getCardTotal,
    getCategoryTotal,
    getAvailableCash,
  };

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
}

export function useFinance() {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error("useFinance must be inside FinanceProvider");
  return ctx;
}
