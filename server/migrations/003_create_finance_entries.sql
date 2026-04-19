CREATE TABLE IF NOT EXISTS finance_entries (
  id BIGSERIAL PRIMARY KEY,
  user_key TEXT NOT NULL DEFAULT 'default',
  type TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
  reference_id TEXT,
  cycle TEXT NOT NULL DEFAULT '',
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS finance_entries_user_cycle_idx
ON finance_entries (user_key, cycle);

CREATE INDEX IF NOT EXISTS finance_entries_user_type_idx
ON finance_entries (user_key, type);
