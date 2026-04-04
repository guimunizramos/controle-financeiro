# Cycle Finance Engine

## Persistência de dados com Local Storage

A camada de dados funciona de forma 100% local usando `localStorage`.

## Arquitetura

- Front-end lê e salva estado financeiro por `src/lib/finance-storage.ts`.
- O estado é persistido na chave `cycle-finance-state-v2`.
- Existe migração automática da chave legada `cycle-finance-data`.
