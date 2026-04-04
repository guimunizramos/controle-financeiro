import { createPostsTable } from "../posts.js";
import { closeDbPool } from "../db.js";

try {
  await createPostsTable();
  console.log("Tabela posts criada/verificada com sucesso.");
} finally {
  await closeDbPool();
}
