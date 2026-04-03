# Cycle Finance Engine

## Supabase persistence

A persistência foi migrada de `localStorage` para Supabase (PostgreSQL) para manter os dados entre navegadores/dispositivos.

### Variáveis de ambiente

Configure no `.env`:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

> Em Vite, também é aceito `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` como fallback.

### Schema

Execute o SQL em `supabase/schema.sql` no seu projeto Supabase.

### Migração inicial

Na primeira execução:

1. O app tenta carregar dados do Supabase.
2. Se não existir registro remoto, ele lê o `localStorage` legado (`cycle-finance-data`).
3. Se encontrar dados legados, salva tudo no Supabase e remove o payload local.
4. Se não houver nada, sobe os dados padrão no banco.
