import { Pool } from "pg";

let pool;

export function getDbPool() {
  if (pool) {
    return pool;
  }

  const connectionString = process.env.storage_POSTGRES_URL;

  if (!connectionString) {
    throw new Error(
      "Nenhuma URL de banco configurada. Defina storage_POSTGRES_URL nas variáveis de ambiente da Vercel.",
    );
  }

  pool = new Pool({
    connectionString,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  return pool;
}

export async function closeDbPool() {
  if (pool) {
    await pool.end();
    pool = undefined;
  }
}
