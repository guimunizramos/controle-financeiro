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

### 2) Instalar pacote do Edge Config SDK

```bash
npm install @vercel/edge-config
```

### 3) Item usado no Edge Config

O app salva e lê o estado financeiro no item:

- `finance_state`

### 4) Middleware de teste (conforme tutorial)

Foi adicionado `middleware.js` com matcher `/welcome`, lendo a chave `greeting` do Edge Config.

Acesse:

- `/welcome`

para validar o fluxo da documentação da Vercel.
