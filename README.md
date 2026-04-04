# Cycle Finance Engine

## Persistência de dados financeiros

A camada financeira do app continua 100% local usando `localStorage` (`src/lib/finance-storage.ts`).

## Persistência de posts com Postgres (Neon)

Os posts agora são persistidos no banco Postgres (Neon), sem uso de `localStorage` para posts.

### Endpoints

- `GET /api/posts` → retorna todos os posts, ordenados por `criado_em` desc.
- `POST /api/posts` → cria post com payload JSON `{ "titulo", "conteudo", "autor" }`.

### Rodando localmente

1. Configure a variável `DATABASE_URL`:

```bash
export DATABASE_URL='postgresql://...'
```

2. Rode a API:

```bash
npm run api
```

3. Em outro terminal, rode o front-end:

```bash
npm run dev
```

> Opcional: `npm run dev:full` para subir API + front-end juntos (requer dependências instaladas).
