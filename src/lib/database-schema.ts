export type InstallmentPurchasesTable = {
  id: string;
  description: string;
  total_value: number;
  total_installments: number;
  paid_installments: number;
  installment_value: number;
  card_origin_id: string;
  category_id: string;
  first_installment_date: string;
};

export type TransactionsTable = {
  id: string;
  date: string;
  description: string;
  amount: number;
  card: string;
  category: string;
  cycle: string;
  installment_purchase_id?: string;
};
