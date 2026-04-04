import { getDbPool } from "./db.js";

/**
 * Salva um novo post na tabela existente.
 */
export async function savePost({ titulo, conteudo, autor }) {
  const pool = getDbPool();

  const result = await pool.query(
    `
      INSERT INTO posts (titulo, conteudo, autor)
      VALUES ($1, $2, $3)
      RETURNING id, titulo, conteudo, autor, criado_em;
    `,
    [titulo, conteudo, autor],
  );

  return result.rows[0];
}

/**
 * Busca posts ordenados do mais recente para o mais antigo.
 */
export async function getPosts() {
  const pool = getDbPool();

  const result = await pool.query(
    `
      SELECT id, titulo, conteudo, autor, criado_em
      FROM posts
      ORDER BY criado_em DESC;
    `,
  );

  return result.rows;
}
