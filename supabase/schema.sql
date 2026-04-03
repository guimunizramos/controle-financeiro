create extension if not exists "pgcrypto";

create table if not exists configurations (
  id uuid primary key default gen_random_uuid(),
  reference_income numeric(12,2) not null,
  selected_cycle text not null,
  cards jsonb not null default '[]'::jsonb,
  fixed_expenses jsonb not null default '[]'::jsonb,
  category_budgets jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists installment_purchases (
  id uuid primary key default gen_random_uuid(),
  description text not null,
  total_value numeric(12,2) not null,
  total_installments integer not null,
  paid_installments integer not null default 0,
  installment_value numeric(12,2) not null,
  card_origin_id text not null,
  category text not null,
  first_installment_date date not null,
  first_cycle text not null,
  last_installment_cycle text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  description text not null,
  amount numeric(12,2) not null,
  card text not null,
  category text not null,
  cycle text not null,
  installment_purchase_id uuid references installment_purchases(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists transactions_cycle_idx on transactions(cycle);
create index if not exists transactions_date_idx on transactions(date desc);
