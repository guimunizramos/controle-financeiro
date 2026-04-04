import http from "node:http";
import { getPosts, savePost } from "./posts.js";
import {
  getFinanceCollection,
  getFinanceSettings,
  getFinanceState,
  replaceFinanceCollection,
  saveFinanceState,
  upsertFinanceSettings,
} from "./finance.js";

const PORT = Number(process.env.API_PORT ?? 3001);

function json(res, statusCode, payload) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,PUT,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });
  res.end(JSON.stringify(payload));
}

async function readBody(req) {
  let body = "";
  for await (const chunk of req) {
    body += chunk;
  }
  return JSON.parse(body || "{}");
}

const COLLECTION_ROUTE_MAP = {
  cards: "cards",
  "fixed-expenses": "fixed_expenses",
  "category-budgets": "category_budgets",
  transactions: "transactions",
  "installment-purchases": "installment_purchases",
};

const server = http.createServer(async (req, res) => {
  if (!req.url) {
    return json(res, 400, { error: "URL inválida" });
  }

  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,PUT,OPTIONS",
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
      return json(res, 500, { error: "Falha ao criar post" });
    }
  }

  if (req.url === "/api/finance/state" && req.method === "GET") {
    try {
      const state = await getFinanceState();
      return json(res, 200, state ?? {});
    } catch (error) {
      console.error("Erro ao carregar estado financeiro:", error);
      return json(res, 500, { error: "Falha ao carregar estado financeiro" });
    }
  }

  if (req.url === "/api/finance/state" && req.method === "PUT") {
    try {
      const payload = await readBody(req);
      const saved = await saveFinanceState(payload);
      return json(res, 200, saved);
    } catch (error) {
      console.error("Erro ao salvar estado financeiro:", error);
      return json(res, 500, { error: "Falha ao salvar estado financeiro" });
    }
  }

  if (req.url === "/api/finance/settings" && req.method === "GET") {
    try {
      const settings = await getFinanceSettings();
      return json(res, 200, settings ?? {});
    } catch (error) {
      console.error("Erro ao carregar configurações financeiras:", error);
      return json(res, 500, { error: "Falha ao carregar configurações financeiras" });
    }
  }

  if (req.url === "/api/finance/settings" && req.method === "PUT") {
    try {
      const payload = await readBody(req);
      const saved = await upsertFinanceSettings(payload);
      return json(res, 200, saved);
    } catch (error) {
      console.error("Erro ao salvar configurações financeiras:", error);
      return json(res, 500, { error: "Falha ao salvar configurações financeiras" });
    }
  }

  const collectionMatch = req.url.match(/^\/api\/finance\/(cards|fixed-expenses|category-budgets|transactions|installment-purchases)$/);
  if (collectionMatch) {
    const collectionType = COLLECTION_ROUTE_MAP[collectionMatch[1]];

    if (req.method === "GET") {
      try {
        const items = await getFinanceCollection(collectionType);
        return json(res, 200, items);
      } catch (error) {
        console.error(`Erro ao buscar ${collectionType}:`, error);
        return json(res, 500, { error: `Falha ao buscar ${collectionType}` });
      }
    }

    if (req.method === "PUT") {
      try {
        const payload = await readBody(req);
        if (!Array.isArray(payload)) {
          return json(res, 400, { error: "Payload deve ser um array" });
        }

        const saved = await replaceFinanceCollection(collectionType, payload);
        return json(res, 200, saved);
      } catch (error) {
        console.error(`Erro ao salvar ${collectionType}:`, error);
        return json(res, 500, { error: `Falha ao salvar ${collectionType}` });
      }
    }
  }

  return json(res, 404, { error: "Rota não encontrada" });
});

server.listen(PORT, () => {
  console.log(`API rodando em http://localhost:${PORT}`);
});
