# Controle Financeiro (Cycle Finance Engine) — Resumo funcional e técnico

> Documento de contexto escrito para ser lido por uma IA/agente antes de mexer no código.
> Descreve **como a aplicação funciona hoje**, não como deveria funcionar.
> Referência: branch `main` no commit `b7ea3fd`.

---

## 1. O que é a aplicação

Aplicação web de **controle financeiro pessoal de um casal** ("Gui" e "Dani"), organizada por **ciclos mensais**
(faturas de cartão + contas fixas + orçamento por categoria + compras parceladas + previsão do mês).

Características centrais:

- **Single-page**, uma única tela real (`/`) com **5 abas**.
- **Mono-usuário**: não há login, sessão ou multi-tenant. Todo o backend grava com `user_key = 'default'` fixo.
- **Sem autenticação e sem autorização** em nenhum endpoint.
- Persistência em **Postgres (Neon)** via **Serverless Functions da Vercel** em `/api`.
- Textos de UI em **português (pt-BR)**; formatação monetária em **BRL**.
- Tema **escuro fixo** (não há toggle claro/escuro), cor primária verde (`hsl(145 100% 39%)`).
- Projeto originado no **Lovable** (ainda há resquícios: metatags `og:` da Lovable, `lovable-tagger`, `lovable-agent-playwright-config`).

---

## 2. Stack e comandos

| Item | Valor |
|---|---|
| Front-end | React 18 + TypeScript + Vite 5 (`@vitejs/plugin-react-swc`) |
| Roteamento | `react-router-dom` v6 |
| UI | Tailwind CSS 3 + shadcn/ui (Radix) — ~50 componentes em `src/components/ui/` |
| Ícones | `lucide-react` |
| Estado global | React Context (`FinanceContext`) — **não** usa Redux/Zustand |
| Data fetching | `fetch` puro. `@tanstack/react-query` está instalado e o `QueryClientProvider` existe, mas **nenhuma query é usada** |
| Back-end | Vercel Functions (ESM, Node) em `/api`, lógica em `/server` |
| Banco | Postgres (Neon), driver `pg` com `Pool` |
| Testes unitários | Vitest + jsdom + Testing Library |
| Testes E2E | Playwright (config delegada a `lovable-agent-playwright-config`, sem specs no repositório) |
| Lint | ESLint 9 (flat config) |

Scripts (`package.json`):

```bash
npm run dev        # Vite na porta 8080, proxy /api -> http://localhost:3001
npm run api:dev    # npx vercel dev --listen 3001  (Serverless Functions)
npm run dev:full   # os dois em paralelo (concurrently)
npm run build      # vite build
npm run test       # vitest run
npm run lint       # eslint .
npm run db:init    # apenas valida a conexão (SELECT 1) — NÃO cria tabelas
```

**Variável de ambiente obrigatória** (`server/db.js`, primeira encontrada vence):
`storage_POSTGRES_URL` → `storage_DATABASE_URL` → `storage_POSTGRES_PRISMA_URL` → `POSTGRES_URL` → `DATABASE_URL`.
Sem nenhuma delas, todo endpoint responde 500. O pool usa `ssl: { rejectUnauthorized: false }`, `max: 3`.

As migrações em `server/migrations/*.sql` **precisam ser aplicadas manualmente** (SQL editor / CLI do Neon).

---

## 3. Mapa de arquivos

```
src/
  main.tsx                       # bootstrap React
  App.tsx                        # providers + rotas
  index.css                      # design tokens (HSL), utilitários .glow-*, .gradient-primary, .mobile-hero-parallax
  pages/
    Index.tsx                    # ÚNICA tela real: header + hero + countdown + 5 abas
    NotFound.tsx                 # 404 (texto em inglês, destoa do resto)
  contexts/
    FinanceContext.tsx           # TODO o estado + regras de negócio + autosave  (arquivo mais importante)
  lib/
    finance-data.ts              # tipos, helpers de ciclo/moeda, DADOS PADRÃO (seed)
    finance-storage.ts           # camada HTTP + normalização + migração de localStorage legado
    posts-api.ts                 # cliente de /api/posts (feature órfã)
    utils.ts                     # cn()
  components/
    tabs/VisaoGeral.tsx          # aba 1
    tabs/Lancamentos.tsx         # aba 2
    tabs/ComprasParceladas.tsx   # aba 3
    tabs/Previsibilidade.tsx     # aba 4
    tabs/Configuracoes.tsx       # aba 5
    CashCard.tsx  InvoiceCard.tsx  CategoryProgress.tsx  TransactionList.tsx  FixedExpenses.tsx
    NavLink.tsx                  # wrapper de NavLink — NÃO é usado em lugar nenhum
    posts/PostsSection.tsx       # CÓDIGO MORTO: não é importado por nenhuma tela
    ui/*                         # shadcn/ui
  test/                          # setup.ts, example.test.ts, lancamentos-utils.test.ts
api/                             # handlers Vercel (roteamento por arquivo)
  _lib/http.js                   # json(), handleOptions(), readBody(), getErrorMessage()  + CORS "*"
  posts.js                       # GET/POST /api/posts
  finance/state.js               # GET/PUT/POST /api/finance/state      <- usado pelo app
  finance/entries.js             # GET/POST/DELETE /api/finance/entries <- usado pelo app
  finance/settings.js            # GET/PUT /api/finance/settings        <- NÃO usado pelo front
  finance/[collection].js        # GET/PUT por coleção                  <- NÃO usado pelo front
server/
  db.js                          # pool Postgres singleton
  finance.js                     # todas as queries financeiras
  posts.js                       # queries de posts
  migrations/001..003.sql
  scripts/init-db.js
```

---

## 4. Rotas

| Rota | Componente | Observação |
|---|---|---|
| `/` | `Index` | Toda a aplicação |
| `*` | `NotFound` | Loga no console e mostra "Oops! Page not found" |

Não há deep-link por aba: a aba ativa é estado interno do `<Tabs>` (Radix), sempre inicia em `visao-geral`
e **não é preservada** ao recarregar.

---

## 5. Conceitos do domínio

### 5.1 Ciclo (`cycle`)
String no formato **`"Mmm/AAAA"`** com meses em português abreviados:
`Jan Fev Mar Abr Mai Jun Jul Ago Set Out Nov Dez` → ex.: `"Abr/2026"`.
É a chave de agrupamento de praticamente tudo (transações, entradas, contas fixas pagas).

Helpers em `src/lib/finance-data.ts`:
- `getCurrentCycle()` — ciclo do mês corrente.
- `getCycleFromDate(date)` — ciclo derivado de uma data (monta a data como `"<YYYY-MM-DD>T00:00:00"` para evitar shift de fuso).
- `addMonthsToCycle(cycle, n)` — soma meses atravessando ano corretamente.
- `cycleToKey()` (em `FinanceContext`) — converte para `ano*12+mês` para ordenar.

`availableCycles` = ciclos distintos presentes nas transações **+** o ciclo atual, ordenados do **mais novo para o mais antigo**.
Se `selectedCycle` deixar de existir nessa lista, um efeito o realinha para `availableCycles[0]`.

> **Importante:** o ciclo de uma transação é **atribuído**, não calculado a partir do dia de fechamento do cartão.
> Um gasto lançado manualmente recebe o `selectedCycle` corrente; parcelas recebem `firstCycle + índice`.
> `closingDay`/`dueDay` do cartão são usados **apenas** para o texto "Fecha em X dias · Vence dia Y".

### 5.2 Rótulo de cartão
`getCardLabel(card)` = `` `${owner} • ${bank}` `` → ex.: `"Gui • Principal"` (separador é o bullet `•`, U+2022).
`getCardOwnerFromLabel(label)` devolve a parte antes do `•`.
Existe ainda o valor especial **`"Pix / Débito"`** no seletor de gasto, que não corresponde a nenhum cartão.

### 5.3 Semáforo de status
`getStatusTag(pct)`: `< 60%` → **OK** (verde) · `< 80%` → **ATENÇÃO** (âmbar) · `>= 80%` → **ALERTA** (vermelho).
Usado nos cards de fatura e nas barras de categoria.

### 5.4 Categoria virtual "Caixa"
`FinanceContext` **deriva** e prefixa uma categoria chamada `Caixa`:

```
Caixa.limit = max(referenceIncome - Σ(limites das demais categorias), 0)
```

- Tem `isFixed: true` e **não é editável** na aba Configurações.
- É bloqueada como nome ao criar categoria (`addCategoryBudget` ignora "caixa", case-insensitive).
- É filtrada fora antes de persistir (`normalizeState` remove `name === "Caixa"`).
- É a **categoria padrão** do formulário de compra parcelada.

### 5.5 Dois "livros" paralelos que não se somam
Este é o ponto mais importante para entender o app:

| Livro | Onde mora | Persistência | Alimenta |
|---|---|---|---|
| **`transactions`** (gastos) | dentro de `FinanceState` | `PUT /api/finance/state` (substitui tudo) | faturas por cartão, gastos por categoria, aba Lançamentos |
| **`entries`** (movimentos de caixa) | tabela própria | `POST/DELETE /api/finance/entries` (linha a linha) | **somente** o card "Caixa Disponível" e a lista de Entradas |

`Entry.type` ∈ `income` | `invoice_paid` | `fixed_paid` | `pix_out`.

```
Caixa Disponível = Σ(entries.income) − Σ(entries de qualquer outro tipo)
```

Ou seja: **um gasto no cartão não reduz o Caixa Disponível** — só reduz quando a fatura é marcada como paga.
Um gasto em `Pix / Débito` é o único caso que grava nos **dois** livros (uma `transaction` e um `entry` `pix_out`).

---

## 6. Modelo de dados (front-end)

`src/lib/finance-data.ts`:

```ts
interface Card              { owner: string; bank: string; limit: number; closingDay: number; dueDay: number }
interface FixedExpense      { name: string; dueDay: number; category: string; amount: number }
interface CategoryBudget    { name: string; limit: number; isFixed?: boolean }
interface Transaction       { id: string; date: string /*YYYY-MM-DD*/; description: string; amount: number;
                              card: string /*label*/; category: string; cycle: string; installmentPurchaseId?: string }
interface InstallmentPurchase {
  id: string; description: string; totalValue: number; totalInstallments: number; paidInstallments: number;
  installmentValue: number; cardOriginId: string /*na prática é o LABEL do cartão*/; category: string;
  firstInstallmentDate: string; firstCycle: string; lastInstallmentCycle: string;
}
```

`src/lib/finance-storage.ts`:

```ts
interface FinanceState {
  cards: Card[]; fixedExpenses: FixedExpense[]; categoryBudgets: CategoryBudget[];
  transactions: Transaction[]; installmentPurchases: InstallmentPurchase[];
  entries: Entry[]; referenceIncome: number; selectedCycle: string;
}
interface Entry {
  id?: number; type: "income" | "invoice_paid" | "fixed_paid" | "pix_out";
  description: string; amount: number; reference_id?: string; cycle: string; date: string;
}
```

IDs de `Transaction` e `InstallmentPurchase` são **UUID v4** (`crypto.randomUUID()`).
IDs de `Entry` são **BIGSERIAL** vindos do banco.

### 6.1 Seed / dados padrão
`finance-data.ts` exporta um dataset de demonstração usado quando o banco está vazio:
2 cartões (Gui/Principal 5000, Dani/Principal 3500), 6 contas fixas (Aluguel, Internet, Energia, Escola Isabelle,
Streaming, Seguro Carro), 8 categorias, `referenceIncome = 9500`, 12 transações fictícias de Mar/Abr 2026
e nenhuma compra parcelada. **Esse seed é gravado no banco na primeira execução.**

---

## 7. Telas

### 7.1 Chrome global (`src/pages/Index.tsx`)

1. **Estado de carregamento** — enquanto `isLoading`, tela cheia com spinner + "Carregando seus dados financeiros...".
2. **Header sticky** — ícone, saudação dinâmica por hora (`Bom dia`/`Boa tarde`/`Boa noite`) + **nome "Gui" hardcoded**;
   à direita, a data de hoje em pt-BR.
3. **Hero** — faixa com gradiente/parallax (`background-attachment: fixed` só em telas < 768px),
   badge "Controle financeiro" e texto institucional estático.
4. **Faixa de contagem regressiva** — "Próxima revisão financeira começa em:" seguida de
   **`07 dias · 14 horas · 32 min · 18 seg` — valores literais hardcoded, não há timer nem cálculo.**
5. **`<Tabs>`** com 5 gatilhos (2 colunas no mobile, 5 no desktop), padrão `visao-geral`.

### 7.2 Aba "Visão Geral" (`VisaoGeral.tsx`)

Cabeçalho com título e um **`Select` de Ciclo/Mês** (`availableCycles`).

Grade superior (3 colunas):
- **`CashCard`** — "Caixa Disponível" = `getAvailableCash()`. Apenas leitura.
- **`InvoiceCard` por *owner* distinto** (não por cartão): total gasto pelo dono no ciclo vs. limite do
  primeiro cartão encontrado daquele dono, barra de progresso, tag de status, "Fecha em N dias · Vence dia D",
  e botão **"Marcar fatura paga"** → cria um `entry` `invoice_paid` com o valor total do ciclo.

Grade inferior (3 colunas):
- **`CategoryProgress`** — todas as categorias (incluindo "Caixa"), gasto/limite, barra e semáforo,
  ordenadas por **% consumido decrescente**.
- **`TransactionList`** — gastos do ciclo, ordem decrescente por data, contagem de itens. Somente leitura.
- **`FixedExpenses`** — lista de contas fixas com **checkbox por conta**: marcar cria `entry` `fixed_paid`
  (`reference_id = nome da conta`, `cycle = selectedCycle`); desmarcar apaga esse `entry`. O total exibido é a
  soma de **todas** as contas fixas, pagas ou não.

### 7.3 Aba "Lançamentos" (`Lancamentos.tsx`)

- **Navegação de ciclo** com setas `‹ Abr/2026 ›` (desabilitadas nas pontas de `availableCycles`).
- **Botão "Nova Entrada"** → diálogo (Data, Valor, Descrição) → `entry` do tipo `income` no ciclo selecionado.
- **Botão "Novo Gasto"** → diálogo (Data, Valor, Categoria, "Nome + Cartão", Descrição) → cria uma `transaction`
  no ciclo selecionado. Se o cartão escolhido for **`Pix / Débito`**, cria **também** um `entry` `pix_out`.
- **Bloco "Entradas"** — lista os `entries` `income` do ciclo com total; ícone de lixeira (aparece no hover) apaga.
- **Bloco "Gastos do Ciclo"** com barra de filtros: **ordenação** (mais recente / mais antigo),
  **filtro por cartão** e **filtro por categoria** (opções derivadas apenas das transações daquele ciclo).
  Tabela: Descrição · Valor · Cartão · Categoria · Data · lixeira. O total no cabeçalho é o do **ciclo inteiro**,
  não o dos itens filtrados.
- **Validações do formulário**: campos obrigatórios e `amount > 0`; falha **silenciosa** (o `submit` só dá `return`,
  sem mensagem de erro).
- **Não há edição de gasto** — apenas criar e excluir.

### 7.4 Aba "Compras Parceladas" (`ComprasParceladas.tsx`)

- Botão **"Nova Compra Parcelada"** → diálogo com: Descrição, **Tipo de valor** (`Valor total` **ou** `Valor da parcela`),
  Qtd Parcelas (mínimo **2**), Valor, Cartão, Categoria (padrão **"Caixa"**), Data da 1ª Parcela.
  Se o modo for "valor da parcela", `totalValue = valorParcela × nParcelas`.
- Ao salvar, o contexto **gera N transações de uma vez** (uma por ciclo futuro):
  - valores via `splitAmountIntoInstallments` (divisão em centavos; o resto de 1 centavo vai para as
    **primeiras** parcelas — ex.: `100 / 3` → `[33.34, 33.33, 33.33]`);
  - descrição `"<descrição> (i/N)"`;
  - `cycle = addMonthsToCycle(firstCycle, i)`;
  - **`date` é a mesma para todas as parcelas** (a data da 1ª); só o `cycle` avança;
  - todas carregam `installmentPurchaseId`.
- **Card por compra**: badge `pagas/total`, valor total, valor da parcela, restantes, ciclo da última parcela,
  barra de progresso, botão **"Marcar parcela como paga"** (só incrementa `paidInstallments`; **não gera `entry`**
  nem movimenta caixa) e botão **"Editar lançamento"**.
- **Edição** reabre o mesmo formulário e, ao salvar, **apaga e regera todas as transações** daquela compra
  (novos UUIDs). `paidInstallments` é preservado, limitado ao novo total.
- Ordenação dos cards: `b.id.localeCompare(a.id)` sobre UUIDs → na prática **ordem arbitrária**.
- **Não há exclusão** de compra parcelada.

### 7.5 Aba "Previsibilidade" (`Previsibilidade.tsx`)

Planejamento do mês, **desconectado dos gastos reais**.

- **Entrada Prevista** — `referenceIncome`, editável inline (lápis → input → ✓/✗). Persistido no banco.
- **Despesas Totais Previstas** — soma de `forecastCategoryExpenses`.
- **Resultado Previsto** — `referenceIncome − totalPrevisto` (verde se ≥ 0, vermelho se < 0).
- **Despesas por Categoria** — lista própria de previsões (adicionar via `+`, editar valor inline, excluir no hover).
  **Atenção: essa lista é armazenada apenas em `localStorage`**, na chave `forecast-category-expenses-v1`.
  Não vai para o banco, não é compartilhada entre dispositivos e **é independente das categorias da aba Configurações**.
- **Sugestões de melhoria** — texto derivado por 3 faixas:
  - `resultado < 0` → "Atenção: previsão negativa" (vermelho);
  - `resultado ≤ 10% da entrada` → "Margem apertada" (âmbar);
  - caso contrário → "Boa previsibilidade" (verde).

### 7.6 Aba "Configurações" (`Configuracoes.tsx`)

Três painéis, cada um com botão `+` (diálogo de criação), edição inline e exclusão no hover:

1. **Cartões** — Nome (**`Select` fixo: apenas "Gui" ou "Dani"**), Banco/Cartão (texto livre),
   Limite, Dia Fechamento, Dia Vencimento.
2. **Contas Fixas** — Nome, Dia Vencimento, Categoria (texto livre, padrão "Outros"), Valor.
3. **Categorias** — Nome + Limite. A categoria "Caixa" é filtrada da lista (`isFixed`) e o nome "caixa" é rejeitado.

Todas as alterações caem no autosave do `FinanceContext` (seção 8).

---

## 8. Estado e persistência (`FinanceContext.tsx`)

### 8.1 Bootstrap (uma vez, no mount)
```
GET /api/finance/state  ─┬─ retornou objeto não vazio ─> usa ele
                         ├─ vazio + existe localStorage legado
                         │     ("cycle-finance-state-v2" ou "cycle-finance-data")
                         │     -> normaliza, PUT no banco, limpa o localStorage
                         └─ vazio e sem legado -> PUT do seed (defaultFinanceState)
GET /api/finance/entries ─> sempre, e sobrescreve state.entries
```
`isLoading` cobre esse período. Se o `fetch` falhar, `fetchFinanceState()` **engole o erro e devolve `null`** —
o app segue com o seed em memória (e pode gravá-lo por cima).

`normalizeState()` também faz saneamento defensivo:
- IDs que não pareçam UUID são regerados (com remapeamento de `installmentPurchaseId`);
- rótulo de cartão sem `•` recebe o sufixo `" • Principal"` (**inclusive `"Pix / Débito"` → `"Pix / Débito • Principal"`**);
- campo legado `card.name` é migrado para `card.owner`;
- a categoria "Caixa" é descartada.

### 8.2 Autosave (só para o `FinanceState`, não para `entries`)
Três guardas antes de gravar:
- `hasInitializedStorage` — bootstrap concluído;
- `isReadyToSaveRef` — vira `true` 200 ms depois do bootstrap (evita gravar durante a hidratação);
- `dirtyRef` — só é marcado por `setDirtyState`, usado pelos mutadores de dados.

Fluxo: mutação → `dirty = true` → **debounce de 1500 ms** → `PUT /api/finance/state` com o estado inteiro.
Salvamentos concorrentes são serializados (`isSavingRef` + `pendingSaveRef`; o último pendente roda ao final).
No `beforeunload`, se houver algo pendente, faz `navigator.sendBeacon("/api/finance/state", blob)`.

> `setSelectedCycle` usa `setState` (não `setDirtyState`) — **trocar de ciclo sozinho não dispara gravação**;
> o ciclo só é persistido de carona no próximo salvamento causado por outra alteração.

> Cada gravação é um **replace total**: o servidor apaga e reinsere todas as linhas de todas as 5 coleções.
> Não há concorrência otimista, versionamento ou merge — a última aba a salvar vence.

`entries` fogem desse fluxo: `addEntry`/`removeEntry` são `async`, batem direto no endpoint e atualizam o estado local.

### 8.3 API exposta pelo `useFinance()`
```
// dados
cards, fixedExpenses, categoryBudgets (com "Caixa" na frente), transactions,
installmentPurchases, entries, referenceIncome, selectedCycle,
forecastCategoryExpenses, availableCycles, isLoading

// CRUD por índice de array
addCard/updateCard/removeCard
addFixedExpense/updateFixedExpense/removeFixedExpense
addCategoryBudget/updateCategoryBudget/removeCategoryBudget
addTransaction/updateTransaction/removeTransaction        // updateTransaction não é usado por nenhuma tela
addForecastCategoryExpense/updateForecastCategoryExpense/removeForecastCategoryExpense  // localStorage

// parceladas
addInstallmentPurchase, updateInstallmentPurchase, markInstallmentAsPaid

// caixa
addEntry (async), removeEntry (async)

// ajustes e cálculos
setReferenceIncome, setSelectedCycle
getCardTotal(owner, cycle)      // filtra pelo DONO extraído do label
getCategoryTotal(category, cycle)
getAvailableCash()
```

> `update*`/`remove*` recebem **índice do array**, não id. As telas resolvem o índice na hora
> (ex.: `transactions.indexOf(tx)` na aba Lançamentos). Qualquer reordenação futura da lista quebra isso.

---

## 9. API HTTP

Todos os handlers respondem `OPTIONS` e enviam **CORS `Access-Control-Allow-Origin: *`**.
Erros retornam `{ error, details }` com status 500; método não suportado → 405.

| Método | Rota | Função | Usado pelo front? |
|---|---|---|---|
| GET | `/api/finance/state` | estado completo (ou `{}`) | ✅ bootstrap |
| PUT/POST | `/api/finance/state` | grava o estado completo | ✅ autosave e `sendBeacon` |
| GET | `/api/finance/entries` | lista `entries` (`ORDER BY date DESC`) | ✅ |
| POST | `/api/finance/entries` | cria `entry` → 201 | ✅ |
| DELETE | `/api/finance/entries` | apaga por `{ id }` no corpo | ✅ |
| GET/PUT | `/api/finance/settings` | `referenceIncome` + `selectedCycle` | ❌ |
| GET/PUT | `/api/finance/cards` \| `fixed-expenses` \| `category-budgets` \| `transactions` \| `installment-purchases` | coleção isolada (PUT exige array) | ❌ |
| GET/POST | `/api/posts` | listar / criar post (`titulo`, `conteudo`, `autor`) | ❌ (tela órfã) |

`server/finance.js` normaliza (coage tipos, faz `trim`) tudo o que entra e sai.
`replaceFinanceCollection` roda em transação com `pg_advisory_xact_lock` derivado do nome da tabela:
`BEGIN → lock → DELETE user_key → INSERT em lote (unnest) → COMMIT`.

---

## 10. Banco de dados

Cinco tabelas de coleção com o **mesmo formato genérico** (`001`–`002`):

```sql
finance_cards | finance_fixed_expenses | finance_category_budgets
finance_transactions | finance_installment_purchases
  id BIGSERIAL PK,
  user_key TEXT NOT NULL DEFAULT 'default',
  position INTEGER NOT NULL,        -- preserva a ordem do array do front
  payload JSONB NOT NULL,           -- o objeto inteiro, sem colunas tipadas
  created_at TIMESTAMPTZ DEFAULT NOW()
  UNIQUE (user_key, position)
```

```sql
finance_settings (user_key PK, reference_income NUMERIC(14,2), selected_cycle TEXT, updated_at)  -- UPSERT

finance_entries (                       -- 003: única tabela com colunas de verdade
  id BIGSERIAL PK, user_key, type TEXT, description TEXT, amount NUMERIC(14,2),
  reference_id TEXT, cycle TEXT, date DATE, created_at
)  -- índices em (user_key, cycle) e (user_key, type)

posts (id, titulo, conteudo, autor, criado_em)   -- 001, feature órfã
```

Consequências do modelo JSONB: não dá para consultar/agregar por SQL, não há FK entre parcelas e transações,
e todo cálculo acontece no cliente com o dataset inteiro em memória.

---

## 11. Testes e qualidade

- `src/test/example.test.ts` — smoke test trivial.
- `src/test/lancamentos-utils.test.ts` — cobre `addMonthsToCycle` (virada de ano) e `splitAmountIntoInstallments`
  (soma exata em centavos, `0 parcelas` → pagamento único).
- **Não há testes de componente, de contexto, de API nem specs de Playwright.** A cobertura real é ~2 funções puras.

---

## 12. Comportamentos e limitações conhecidas (leia antes de alterar)

**Produto / UX**
1. Contagem regressiva do hero é **estática** (`07/14/32/18`) — não existe timer nem data-alvo.
2. Saudação sempre diz **"Gui"**; o `Select` de dono de cartão só oferece **Gui/Dani** (hardcoded).
3. `PostsSection.tsx` + `posts-api.ts` + `/api/posts` + tabela `posts` são uma feature **órfã** (nada renderiza).
   `NavLink.tsx` também não é usado.
4. `NotFound` está em inglês, destoando do resto do app.
5. Erros de formulário são **silenciosos** (nenhum `toast`, embora `Toaster` e `Sonner` estejam montados).
6. Não há edição de transação na UI (a função existe no contexto, sem consumidor) nem exclusão de compra parcelada.

**Cálculos**
7. `InvoiceCard` agrega por **dono**, não por cartão: se "Gui" tiver 2 cartões, o total soma os dois e o
   limite mostrado é o do **primeiro** cartão daquele dono.
8. Gastos em `Pix / Débito` contam no **orçamento da categoria** mas em nenhuma fatura — e, após um reload,
   o rótulo vira `"Pix / Débito • Principal"` por causa de `normalizeCardLabel`.
9. "Marcar fatura paga" **não tem idempotência**: cada clique cria um novo `entry` `invoice_paid`,
   derrubando o Caixa Disponível de novo. Não há como desfazer pela UI (só apagando na aba Lançamentos… onde
   a lista de entradas mostra **apenas `income`** — ou seja, `invoice_paid`/`pix_out` **não são visíveis nem
   removíveis em nenhuma tela**).
10. `markInstallmentAsPaid` só incrementa um contador: não gera `entry`, não altera transação, não é reversível.
11. `purchase.installmentValue = totalValue / totalInstallments` (float bruto) diverge dos valores reais das
    parcelas geradas por `splitAmountIntoInstallments` — o card pode exibir algo como `R$ 33,33…` enquanto a
    1ª parcela é `33,34`.
12. Editar uma compra parcelada **regera todas as transações com novos IDs**, inclusive as de ciclos já passados.
13. O total do bloco "Gastos do Ciclo" ignora os filtros aplicados logo acima.
14. Previsibilidade não conversa com a realidade: as despesas previstas vivem em `localStorage` e não têm
    relação com `categoryBudgets` nem com os gastos lançados.

**Infra / dados**
15. **Sem autenticação**; `user_key` é sempre `'default'`. Qualquer um com a URL lê e escreve tudo. CORS é `*`.
16. Todo save é um **replace total** das 5 coleções — cresce linearmente com o histórico e não tolera
    duas abas/dispositivos editando ao mesmo tempo (last-write-wins).
17. Falha de rede no bootstrap é silenciosa e faz o app operar sobre o **seed de demonstração**,
    com risco de gravá-lo por cima dos dados reais no próximo autosave.
18. `npm run db:init` **não cria tabelas**, só valida a conexão — as migrações são manuais.
19. `@tanstack/react-query`, `@supabase/supabase-js`, `@vercel/edge-config`, `recharts`, `react-hook-form`+`zod`
    estão instalados mas **não são usados** no código de produção (não há nenhum gráfico na aplicação).

---

## 13. Receitas rápidas para alterar o código

| Objetivo | Onde mexer |
|---|---|
| Nova aba | `src/pages/Index.tsx` (`TabsList` + `TabsContent`) e um novo componente em `src/components/tabs/` |
| Novo campo em cartão/conta/categoria/transação | tipo em `finance-data.ts` → normalizador em `server/finance.js` → formulários. **Não precisa de migração** (é JSONB) |
| Novo tipo de movimento de caixa | ampliar a union `Entry["type"]` em `finance-storage.ts` e ajustar `getAvailableCash()` |
| Nova regra de cálculo | `FinanceContext.tsx` (é onde vive toda a regra de negócio) |
| Novo endpoint | criar arquivo em `api/` usando os helpers de `api/_lib/http.js` e a lógica em `server/` |
| Cores / tema | tokens HSL em `src/index.css` (`:root`) — evite cores literais nos componentes |
| Persistir algo que hoje é `localStorage` | `forecastCategoryExpenses` é o caso pendente: precisa entrar em `FinanceState` + `server/finance.js` + nova tabela/coleção |
