import { getPosts, savePost } from "../server/posts.js";
import { getErrorMessage, handleOptions, json, readBody } from "./_lib/http.js";

export default async function handler(req, res) {
  if (handleOptions(req, res)) {
    return;
  }

  if (req.method === "GET") {
    try {
      const posts = await getPosts();
      return json(res, 200, posts);
    } catch (error) {
      console.error("Erro ao buscar posts:", error);
      return json(res, 500, {
        error: "Falha ao buscar posts",
        details: getErrorMessage(error),
      });
    }
  }

  if (req.method === "POST") {
    try {
      const parsed = await readBody(req);
      const titulo = String(parsed.titulo ?? "").trim();
      const conteudo = String(parsed.conteudo ?? "").trim();
      const autor = String(parsed.autor ?? "").trim();

      if (!titulo || !conteudo || !autor) {
        return json(res, 400, { error: "Campos obrigatórios: titulo, conteudo, autor" });
      }

      const created = await savePost({ titulo, conteudo, autor });
      return json(res, 201, created);
    } catch (error) {
      console.error("Erro ao criar post:", error);
      return json(res, 500, {
        error: "Falha ao criar post",
        details: getErrorMessage(error),
      });
    }
  }

  return json(res, 405, { error: "Método não permitido" });
}
