import { getDbPool, closeDbPool } from "../db.js";

async function main() {
  await getDbPool().query("SELECT 1;");
  console.log("Conexão com o banco validada. A tabela posts deve existir previamente.");
}

main()
  .catch((error) => {
    console.error("Falha ao validar conexão com o banco:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeDbPool();
  });
