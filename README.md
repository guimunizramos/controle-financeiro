# Cycle Finance Engine

## Persistência de dados no Postgres (Neon)

A aplicação agora persiste **posts + dados financeiros** no banco Postgres (Neon), sem uso de `localStorage` como armazenamento principal.

## Dados financeiros mapeados para o banco

Os dados que antes eram salvos no `localStorage` foram separados em coleções de banco:

- `cards`
- `fixedExpenses`
- `categoryBudgets`
- `transactions`
- `installmentPurchases`
- `settings` (`referenceIncome` e `selectedCycle`)

## Migrações SQL

- `server/migrations/001_create_posts.sql`
- `server/migrations/002_create_finance_tables.sql`

## Endpoints (Vercel Functions em `/api`)

### Posts

- `GET /api/posts`
- `POST /api/posts`

### Financeiro (por tipo de dado)

- `GET /api/finance/cards`
- `PUT /api/finance/cards`
- `GET /api/finance/fixed-expenses`
- `PUT /api/finance/fixed-expenses`
- `GET /api/finance/category-budgets`
- `PUT /api/finance/category-budgets`
- `GET /api/finance/transactions`
- `PUT /api/finance/transactions`
- `GET /api/finance/installment-purchases`
- `PUT /api/finance/installment-purchases`
- `GET /api/finance/settings`
- `PUT /api/finance/settings`

### Estado completo (bootstrap do app)

- `GET /api/finance/state`
- `PUT /api/finance/state`

## Rodando localmente

1. Configure a variável `DATABASE_URL`:

```bash
export DATABASE_URL='postgresql://...'
```

2. Rode as migrações no seu banco Neon (via SQL editor/CLI).

3. Rode as Serverless Functions localmente (Vercel):

```bash
npm run api:dev
```

4. Em outro terminal, rode o front-end:

```bash
npm run dev
```

> Opcional: `npm run dev:full` para subir Functions + front-end juntos.
