import { Pool } from "pg";

let pool;

export function getDbPool() {
  if (pool) {
    return pool;
  }

  const connectionString =
    process.env.storage_POSTGRES_URL ||
    process.env.storage_DATABASE_URL ||
    process.env.storage_POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL;

  if (!connectionString) {
    console.log(
      "ENV vars disponíveis:",
      Object.keys(process.env).filter(
        (k) => k.includes("POSTGRES") || k.includes("DATABASE"),
      ),
    );
    throw new Error(
      "Nenhuma URL de banco configurada. Defina storage_POSTGRES_URL nas variáveis de ambiente da Vercel.",
    );
  }

  pool = new Pool({
    connectionString,
    max: 1,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 5000,
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
