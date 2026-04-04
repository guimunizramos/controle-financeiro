# Cycle Finance Engine

## Persistência de dados com Local Storage

A camada de dados funciona de forma 100% local usando `localStorage`.

## Arquitetura

- Front-end lê e salva estado financeiro por `src/lib/finance-storage.ts`.
- O estado é persistido na chave `cycle-finance-state-v2`.
- Existe migração automática da chave legada `cycle-finance-data`.

## Integração com Postgres (Neon)

Foi adicionada uma camada backend simples em `server/` para persistir posts no Neon usando o driver `pg`.

### 1) Instalar dependências

```bash
npm install
```

> Observação: este ambiente bloqueou acesso ao npm registry (erro 403), então a dependência foi adicionada ao `package.json`, mas a instalação precisa ser executada em um ambiente com acesso ao registry.

### 2) Configurar a URL do banco

Defina a variável `DATABASE_URL` no ambiente do backend:

```bash
export DATABASE_URL='postgresql://...'
```

### 3) Criar tabela de posts

```bash
npm run db:init
```

### 4) Funções disponíveis

No arquivo `server/posts.js`:

- `createPostsTable()` → cria tabela e índice.
- `savePost({ title, content, author })` → salva post.
- `getPosts({ limit, offset })` → busca posts ordenados pelos mais recentes.
