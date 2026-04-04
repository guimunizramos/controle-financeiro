import { getDbPool } from "./db.js";

/**
 * Garante que a tabela de posts exista no banco.
 */
export async function createPostsTable() {
  const pool = getDbPool();

  await pool.query(`
    CREATE TABLE IF NOT EXISTS posts (
      id BIGSERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      author TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS posts_created_at_idx
    ON posts (created_at DESC);
  `);
}

/**
 * Salva um novo post.
 */
export async function savePost({ title, content, author }) {
  const pool = getDbPool();

  const result = await pool.query(
    `
      INSERT INTO posts (title, content, author)
      VALUES ($1, $2, $3)
      RETURNING id, title, content, author, created_at;
    `,
    [title, content, author],
  );

  return result.rows[0];
}

/**
 * Busca posts ordenados do mais recente para o mais antigo.
 */
export async function getPosts({ limit = 20, offset = 0 } = {}) {
  const pool = getDbPool();

  const result = await pool.query(
    `
      SELECT id, title, content, author, created_at
      FROM posts
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2;
    `,
    [limit, offset],
  );

  return result.rows;
}
