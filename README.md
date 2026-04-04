# Cycle Finance Engine

## Persistência de dados com Vercel Edge Config

A camada de dados foi refeita para funcionar com **Vercel Edge Config** como banco remoto e `localStorage` como cache/fallback local.

## Arquitetura

- Front-end lê e salva estado financeiro por `src/lib/finance-storage.ts`.
- A API `api/finance-state.ts` faz:
  - `GET` do item `finance_state` no Edge Config.
  - `POST` (upsert) no mesmo item via API de gerenciamento da Vercel.
- Em falha remota, o app continua funcionando localmente sem bloquear a UI.

## Variáveis de ambiente

Configure no projeto Vercel:

```bash
EDGE_CONFIG=...
EDGE_CONFIG_ID=...
EDGE_CONFIG_TOKEN=...
```

- `EDGE_CONFIG`: connection string usada para leitura.
- `EDGE_CONFIG_ID` + `EDGE_CONFIG_TOKEN`: credenciais para escrita (`PATCH` de itens).

## Item persistido no Edge Config

- Chave: `finance_state`
- Valor: objeto JSON com o estado completo das finanças.
