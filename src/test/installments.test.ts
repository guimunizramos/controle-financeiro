import { describe, expect, it } from "vitest";
import { cards, createInstallmentBundle, determineCycle } from "@/lib/finance-data";

describe("installment purchase flow", () => {
  it("creates purchase metadata and one transaction per installment", () => {
    const { purchase, generatedTransactions } = createInstallmentBundle(
      {
        description: "Fone de ouvido",
        totalValue: 600,
        totalInstallments: 6,
        cardOriginId: "Gui",
        categoryId: "Lazer",
        firstInstallmentDate: "2026-04-10",
      },
      cards
    );

    expect(purchase.paidInstallments).toBe(0);
    expect(purchase.installmentValue).toBe(100);
    expect(generatedTransactions).toHaveLength(6);
    expect(generatedTransactions[0].description).toContain("(1/6)");
    expect(generatedTransactions[5].description).toContain("(6/6)");
    expect(generatedTransactions.every((tx) => tx.installmentPurchaseId === purchase.id)).toBe(true);
  });

  it("uses card closing day to determine cycle", () => {
    expect(determineCycle("2026-04-08", "Gui", cards)).toBe("Abr/2026");
    expect(determineCycle("2026-04-09", "Gui", cards)).toBe("Mai/2026");
  });
});
