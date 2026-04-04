import { getFinanceCollection, replaceFinanceCollection } from "../../server/finance.js";
import { getErrorMessage, handleOptions, json, readBody } from "../_lib/http.js";

const COLLECTION_ROUTE_MAP = {
  cards: "cards",
  "fixed-expenses": "fixed_expenses",
  "category-budgets": "category_budgets",
  transactions: "transactions",
  "installment-purchases": "installment_purchases",
};

export default async function handler(req, res) {
  if (handleOptions(req, res)) {
    return;
  }

  const slug = Array.isArray(req.query.collection) ? req.query.collection[0] : req.query.collection;
  const collectionType = COLLECTION_ROUTE_MAP[String(slug ?? "")];

  if (!collectionType) {
    return json(res, 404, { error: "Rota não encontrada" });
  }

  if (req.method === "GET") {
    try {
      const items = await getFinanceCollection(collectionType);
      return json(res, 200, items);
    } catch (error) {
      console.error(`Erro ao buscar ${collectionType}:`, error);
      return json(res, 500, {
        error: `Falha ao buscar ${collectionType}`,
        details: getErrorMessage(error),
      });
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
      return json(res, 500, {
        error: `Falha ao salvar ${collectionType}`,
        details: getErrorMessage(error),
      });
    }
  }

  return json(res, 405, { error: "Método não permitido" });
}
