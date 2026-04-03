import { useCallback, useMemo, useState } from "react";
import { createInstallmentBundle, type InstallmentPurchase, type InstallmentPurchaseInput, type Transaction } from "@/lib/finance-data";
import { useFinance } from "@/contexts/FinanceContext";

const STORAGE_KEY = "cycle-finance-installments";

function loadInstallments(): InstallmentPurchase[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore malformed payloads
  }
  return [];
}

export function useInstallmentPurchases() {
  const { cards, transactions, addTransaction, updateTransaction } = useFinance();
  const [installmentPurchases, setInstallmentPurchases] = useState<InstallmentPurchase[]>(loadInstallments);

  const persist = useCallback((next: InstallmentPurchase[]) => {
    setInstallmentPurchases(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const addInstallmentPurchase = useCallback((input: InstallmentPurchaseInput) => {
    const { purchase, generatedTransactions } = createInstallmentBundle(input, cards);
    generatedTransactions.forEach((tx) => addTransaction(tx as Transaction));
    persist([...installmentPurchases, purchase]);
  }, [addTransaction, cards, installmentPurchases, persist]);

  const markInstallmentAsPaid = useCallback((purchaseId: string) => {
    const purchase = installmentPurchases.find((entry) => entry.id === purchaseId);
    if (!purchase) return;

    const pending = transactions
      .filter((tx) => tx.installmentPurchaseId === purchaseId && !tx.isPaid)
      .sort((a, b) => (a.installmentNumber ?? 0) - (b.installmentNumber ?? 0));

    const nextPending = pending[0];
    if (!nextPending) return;

    const index = transactions.findIndex((tx) => tx.id === nextPending.id);
    if (index >= 0) {
      updateTransaction(index, { ...nextPending, isPaid: true });
    }

    const followingPending = pending[1];
    const next = installmentPurchases.map((entry) =>
      entry.id !== purchaseId
        ? entry
        : {
            ...entry,
            paidInstallments: Math.min(entry.paidInstallments + 1, entry.totalInstallments),
            nextInstallmentCycle: followingPending?.cycle ?? "Quitado",
          }
    );

    persist(next);
  }, [installmentPurchases, persist, transactions, updateTransaction]);

  const installmentTransactions = useMemo(
    () => transactions.filter((tx) => tx.installmentPurchaseId),
    [transactions]
  );

  return { installmentPurchases, installmentTransactions, addInstallmentPurchase, markInstallmentAsPaid };
}
