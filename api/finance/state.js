import { getFinanceState, saveFinanceState } from "../../server/finance.js";
import { handleOptions, json, readBody } from "../_lib/http.js";

export default async function handler(req, res) {
  if (handleOptions(req, res)) {
    return;
  }

  if (req.method === "GET") {
    try {
      const state = await getFinanceState();
      return json(res, 200, state ?? {});
    } catch (error) {
      console.error("Erro ao carregar estado financeiro:", error);
      return json(res, 500, {
        error: "Falha ao carregar estado financeiro",
        details: error?.message || String(error),
      });
    }
  }

  if (req.method === "PUT") {
    try {
      const payload = await readBody(req);
      const saved = await saveFinanceState(payload);
      return json(res, 200, saved);
    } catch (error) {
      console.error("Erro ao salvar estado financeiro:", error);
      return json(res, 500, {
        error: "Falha ao salvar estado financeiro",
        details: error?.message || String(error),
      });
    }
  }

  return json(res, 405, { error: "Método não permitido" });
}
