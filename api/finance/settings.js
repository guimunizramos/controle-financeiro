import { getFinanceSettings, upsertFinanceSettings } from "../../server/finance.js";
import { getErrorMessage, handleOptions, json, readBody } from "../_lib/http.js";

export default async function handler(req, res) {
  if (handleOptions(req, res)) {
    return;
  }

  if (req.method === "GET") {
    try {
      const settings = await getFinanceSettings();
      return json(res, 200, settings ?? {});
    } catch (error) {
      console.error("Erro ao carregar configurações financeiras:", error);
      return json(res, 500, {
        error: "Falha ao carregar configurações financeiras",
        details: getErrorMessage(error),
      });
    }
  }

  if (req.method === "PUT") {
    try {
      const payload = await readBody(req);
      const saved = await upsertFinanceSettings(payload);
      return json(res, 200, saved);
    } catch (error) {
      console.error("Erro ao salvar configurações financeiras:", error);
      return json(res, 500, {
        error: "Falha ao salvar configurações financeiras",
        details: getErrorMessage(error),
      });
    }
  }

  return json(res, 405, { error: "Método não permitido" });
}
