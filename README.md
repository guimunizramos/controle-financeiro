# Cycle Finance Engine

## Persistência com Vercel Edge Config

A persistência remota usa **Vercel Edge Config** e mantém `localStorage` como fallback local.

### 1) Variáveis de ambiente

No projeto Vercel, conecte o **Edge Config Store** ao projeto e rode:

```bash
vercel env pull
```

Para escrita pelo app (rota `/api/finance-state`), configure também:

```bash
EDGE_CONFIG_ID=...
EDGE_CONFIG_TOKEN=...
```

> `EDGE_CONFIG` é usado para leitura remota.  
> `EDGE_CONFIG_ID` + `EDGE_CONFIG_TOKEN` são usados para `PATCH` de itens.

### 2) Instalar pacote do Edge Config SDK (opcional)

```bash
npm install @vercel/edge-config
```

> O projeto atual funciona sem SDK no código de API (usa `fetch` HTTP),
> mas o pacote pode ser útil para integrações futuras.

### 3) Item usado no Edge Config

O app salva e lê o estado financeiro no item:

- `finance_state`

### 4) Teste recomendado para projeto Vite

Use o endpoint Edge Function:

- `/api/welcome`

Ele lê a chave `greeting` direto do Edge Config sem depender de `next/server`.

### 5) Middleware `/welcome` (somente Next.js)

Se o projeto for **Next.js**, você pode usar middleware com `next/server`.

Se o projeto for **Vite** (este repositório), **não use** `middleware.js` com `next/server`.
