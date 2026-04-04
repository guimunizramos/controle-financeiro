# Cycle Finance Engine

## Persistência com Vercel Edge Config

A persistência foi ajustada para usar **Vercel Edge Config** como fonte remota e `localStorage` como fallback local.

### 1) Variáveis de ambiente

No projeto Vercel, conecte o **Edge Config Store** ao projeto e rode:

```bash
vercel env pull
```

Para escrita pelo app (salvar alterações), configure também:

```bash
EDGE_CONFIG_ID=...
EDGE_CONFIG_TOKEN=...
```

> `EDGE_CONFIG` é usado para leitura remota.
> `EDGE_CONFIG_ID` + `EDGE_CONFIG_TOKEN` são usados pela rota `/api/finance-state` para `PATCH` de itens.

### 2) Item usado no Edge Config

O app salva e lê o estado financeiro no item:

- `finance_state`

### 3) Endpoint de teste (`/api/welcome`)

Para evitar erro de build em projeto Vite (sem `next/server`), foi adicionado `api/welcome.ts` lendo a chave `greeting` direto do Edge Config.

Acesse:

- `/api/welcome`

para validar o fluxo da documentação da Vercel.

### 4) Importante para evitar conflito de merge/deploy

- Use **somente** `api/welcome.ts` (Edge Function).
- **Não** use `middleware.js` com `next/server` neste projeto Vite.
- Se aparecer conflito entre versões de README, mantenha a versão que referencia `/api/welcome` e remova qualquer bloco sobre `middleware.js`/`/welcome`.
