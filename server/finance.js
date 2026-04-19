import { getDbPool } from "./db.js";

const DEFAULT_USER_KEY = "default";

function hashStringToInt(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash;
}

function normalizeCard(card) {
  return {
    owner: String(card?.owner ?? "").trim(),
    bank: String(card?.bank ?? "").trim(),
    limit: Number(card?.limit ?? 0),
    closingDay: Number(card?.closingDay ?? 1),
    dueDay: Number(card?.dueDay ?? 1),
  };
}

function normalizeFixedExpense(expense) {
  return {
    name: String(expense?.name ?? "").trim(),
    dueDay: Number(expense?.dueDay ?? 1),
    category: String(expense?.category ?? "Outros").trim(),
    amount: Number(expense?.amount ?? 0),
  };
}

function normalizeCategoryBudget(category) {
  return {
    name: String(category?.name ?? "").trim(),
    limit: Number(category?.limit ?? 0),
    isFixed: Boolean(category?.isFixed),
  };
}

function normalizeTransaction(tx) {
  return {
    id: String(tx?.id ?? "").trim(),
    date: String(tx?.date ?? "").trim(),
    description: String(tx?.description ?? "").trim(),
    amount: Number(tx?.amount ?? 0),
    card: String(tx?.card ?? "").trim(),
    category: String(tx?.category ?? "").trim(),
    cycle: String(tx?.cycle ?? "").trim(),
    installmentPurchaseId: tx?.installmentPurchaseId ? String(tx.installmentPurchaseId).trim() : null,
  };
}

function normalizeInstallmentPurchase(purchase) {
  return {
    id: String(purchase?.id ?? "").trim(),
    description: String(purchase?.description ?? "").trim(),
    totalValue: Number(purchase?.totalValue ?? 0),
    totalInstallments: Number(purchase?.totalInstallments ?? 1),
    paidInstallments: Number(purchase?.paidInstallments ?? 0),
    installmentValue: Number(purchase?.installmentValue ?? 0),
    cardOriginId: String(purchase?.cardOriginId ?? "").trim(),
    category: String(purchase?.category ?? "").trim(),
    firstInstallmentDate: String(purchase?.firstInstallmentDate ?? "").trim(),
    firstCycle: String(purchase?.firstCycle ?? "").trim(),
    lastInstallmentCycle: String(purchase?.lastInstallmentCycle ?? "").trim(),
  };
}

export async function getFinanceCollection(type) {
  const pool = getDbPool();
  const table = `finance_${type}`;
  const result = await pool.query(
    `
      SELECT payload
      FROM ${table}
      WHERE user_key = $1
      ORDER BY position ASC;
    `,
    [DEFAULT_USER_KEY],
  );
  return result.rows.map((row) => row.payload);
}

export async function replaceFinanceCollection(type, items) {
  const pool = getDbPool();
  const table = `finance_${type}`;
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    const lockId = hashStringToInt(table);
    await client.query("SELECT pg_advisory_xact_lock($1)", [lockId]);
    await client.query(`DELETE FROM ${table} WHERE user_key = $1`, [DEFAULT_USER_KEY]);

    if (items.length > 0) {
      const positions = items.map((_, i) => i);
      const payloads = items.map((item) => JSON.stringify(item));
      const userKeys = items.map(() => DEFAULT_USER_KEY);
      await client.query(
        `
          INSERT INTO ${table} (user_key, position, payload)
          SELECT unnest($1::text[]), unnest($2::int[]), unnest($3::jsonb[]);
        `,
        [userKeys, positions, payloads],
      );
    }

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }

  return items;
}

export async function getFinanceSettings() {
  const pool = getDbPool();
  const result = await pool.query(
    `
      SELECT reference_income, selected_cycle
      FROM finance_settings
      WHERE user_key = $1;
    `,
    [DEFAULT_USER_KEY],
  );

  if (result.rows.length === 0) {
    return null;
  }

  return {
    referenceIncome: Number(result.rows[0].reference_income),
    selectedCycle: result.rows[0].selected_cycle,
  };
}

export async function upsertFinanceSettings(settings) {
  const pool = getDbPool();
  const referenceIncome = Number(settings?.referenceIncome ?? 0);
  const selectedCycle = String(settings?.selectedCycle ?? "").trim();

  const result = await pool.query(
    `
      INSERT INTO finance_settings (user_key, reference_income, selected_cycle)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_key)
      DO UPDATE SET reference_income = EXCLUDED.reference_income, selected_cycle = EXCLUDED.selected_cycle
      RETURNING reference_income, selected_cycle;
    `,
    [DEFAULT_USER_KEY, referenceIncome, selectedCycle],
  );

  return {
    referenceIncome: Number(result.rows[0].reference_income),
    selectedCycle: result.rows[0].selected_cycle,
  };
}

export async function getFinanceState() {
  const [cards, fixedExpenses, categoryBudgets, transactions, installmentPurchases, settings] = await Promise.all([
    getFinanceCollection("cards"),
    getFinanceCollection("fixed_expenses"),
    getFinanceCollection("category_budgets"),
    getFinanceCollection("transactions"),
    getFinanceCollection("installment_purchases"),
    getFinanceSettings(),
  ]);

  if (
    cards.length === 0 &&
    fixedExpenses.length === 0 &&
    categoryBudgets.length === 0 &&
    transactions.length === 0 &&
    installmentPurchases.length === 0 &&
    !settings
  ) {
    return null;
  }

  return {
    cards: cards.map(normalizeCard),
    fixedExpenses: fixedExpenses.map(normalizeFixedExpense),
    categoryBudgets: categoryBudgets.map(normalizeCategoryBudget),
    transactions: transactions.map(normalizeTransaction),
    installmentPurchases: installmentPurchases.map(normalizeInstallmentPurchase),
    referenceIncome: Number(settings?.referenceIncome ?? 0),
    selectedCycle: String(settings?.selectedCycle ?? ""),
  };
}

export async function saveFinanceState(state) {
  const normalized = {
    cards: (state?.cards ?? []).map(normalizeCard),
    fixedExpenses: (state?.fixedExpenses ?? []).map(normalizeFixedExpense),
    categoryBudgets: (state?.categoryBudgets ?? []).map(normalizeCategoryBudget),
    transactions: (state?.transactions ?? []).map(normalizeTransaction),
    installmentPurchases: (state?.installmentPurchases ?? []).map(normalizeInstallmentPurchase),
    referenceIncome: Number(state?.referenceIncome ?? 0),
    selectedCycle: String(state?.selectedCycle ?? "").trim(),
  };

  await replaceFinanceCollection("cards", normalized.cards);
  await replaceFinanceCollection("fixed_expenses", normalized.fixedExpenses);
  await replaceFinanceCollection("category_budgets", normalized.categoryBudgets);
  await replaceFinanceCollection("transactions", normalized.transactions);
  await replaceFinanceCollection("installment_purchases", normalized.installmentPurchases);
  await upsertFinanceSettings({
    referenceIncome: normalized.referenceIncome,
    selectedCycle: normalized.selectedCycle,
  });

  return normalized;
}

export async function getEntries(userKey = "default") {
  const pool = getDbPool();
  const result = await pool.query(
    "SELECT * FROM finance_entries WHERE user_key = $1 ORDER BY date DESC",
    [userKey],
  );
  return result.rows;
}

export async function addEntry(entry, userKey = "default") {
  const pool = getDbPool();
  const result = await pool.query(
    `INSERT INTO finance_entries (user_key, type, description, amount, reference_id, cycle, date)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [userKey, entry.type, entry.description, entry.amount, entry.reference_id || null, entry.cycle, entry.date],
  );
  return result.rows[0];
}

export async function deleteEntry(id, userKey = "default") {
  const pool = getDbPool();
  await pool.query("DELETE FROM finance_entries WHERE id = $1 AND user_key = $2", [id, userKey]);
}
