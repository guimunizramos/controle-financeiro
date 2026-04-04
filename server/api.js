import http from "node:http";
import { getPosts, savePost } from "./posts.js";

const PORT = Number(process.env.API_PORT ?? 3001);

function json(res, statusCode, payload) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });
  res.end(JSON.stringify(payload));
}

const server = http.createServer(async (req, res) => {
  if (!req.url) {
    return json(res, 400, { error: "URL inválida" });
  }

  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    });
    return res.end();
  }

  if (req.url === "/api/posts" && req.method === "GET") {
    try {
      const posts = await getPosts();
      return json(res, 200, posts);
    } catch (error) {
      console.error("Erro ao buscar posts:", error);
      return json(res, 500, { error: "Falha ao buscar posts" });
    }
  }

  if (req.url === "/api/posts" && req.method === "POST") {
    try {
      let body = "";
      for await (const chunk of req) {
        body += chunk;
      }

      const parsed = JSON.parse(body || "{}");
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
      return json(res, 500, { error: "Falha ao criar post" });
    }
  }

  return json(res, 404, { error: "Rota não encontrada" });
});

server.listen(PORT, () => {
  console.log(`API de posts rodando em http://localhost:${PORT}`);
});
