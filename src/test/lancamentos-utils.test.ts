import { describe, expect, it } from "vitest";
import { addMonthsToCycle, splitAmountIntoInstallments } from "@/lib/finance-data";

describe("Lancamentos helpers", () => {
  it("adds months to cycle across year boundaries", () => {
    expect(addMonthsToCycle("Dez/2025", 1)).toBe("Jan/2026");
    expect(addMonthsToCycle("Jan/2026", 14)).toBe("Mar/2027");
  });

  it("splits amounts keeping total exact in cents", () => {
    const installments = splitAmountIntoInstallments(100, 3);
    expect(installments).toEqual([33.34, 33.33, 33.33]);

    const total = installments.reduce((sum, value) => sum + value, 0);
    expect(total).toBe(100);
  });

  it("handles invalid installment counts as a single payment", () => {
    expect(splitAmountIntoInstallments(12.5, 0)).toEqual([12.5]);
  });
});
