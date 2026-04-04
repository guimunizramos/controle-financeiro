CREATE TABLE IF NOT EXISTS finance_cards (
  id BIGSERIAL PRIMARY KEY,
  user_key TEXT NOT NULL DEFAULT 'default',
  position INTEGER NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS finance_cards_user_position_idx
ON finance_cards (user_key, position);

CREATE TABLE IF NOT EXISTS finance_fixed_expenses (
  id BIGSERIAL PRIMARY KEY,
  user_key TEXT NOT NULL DEFAULT 'default',
  position INTEGER NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS finance_fixed_expenses_user_position_idx
ON finance_fixed_expenses (user_key, position);

CREATE TABLE IF NOT EXISTS finance_category_budgets (
  id BIGSERIAL PRIMARY KEY,
  user_key TEXT NOT NULL DEFAULT 'default',
  position INTEGER NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS finance_category_budgets_user_position_idx
ON finance_category_budgets (user_key, position);

CREATE TABLE IF NOT EXISTS finance_transactions (
  id BIGSERIAL PRIMARY KEY,
  user_key TEXT NOT NULL DEFAULT 'default',
  position INTEGER NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS finance_transactions_user_position_idx
ON finance_transactions (user_key, position);

CREATE TABLE IF NOT EXISTS finance_installment_purchases (
  id BIGSERIAL PRIMARY KEY,
  user_key TEXT NOT NULL DEFAULT 'default',
  position INTEGER NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS finance_installment_purchases_user_position_idx
ON finance_installment_purchases (user_key, position);

CREATE TABLE IF NOT EXISTS finance_settings (
  user_key TEXT PRIMARY KEY DEFAULT 'default',
  reference_income NUMERIC(14, 2) NOT NULL DEFAULT 0,
  selected_cycle TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
