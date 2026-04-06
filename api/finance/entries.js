import { getEntries, addEntry, deleteEntry } from "../../server/finance.js";
import { handleOptions, json, readBody, getErrorMessage } from "../_lib/http.js";

export default async function handler(req, res) {
  if (handleOptions(req, res)) return;

  if (req.method === "GET") {
    try {
      const entries = await getEntries();
      return json(res, 200, entries);
    } catch (error) {
      return json(res, 500, { error: "Falha ao buscar entradas", details: getErrorMessage(error) });
    }
  }

  if (req.method === "POST") {
    try {
      const body = await readBody(req);
      const entry = await addEntry(body);
      return json(res, 201, entry);
    } catch (error) {
      return json(res, 500, { error: "Falha ao criar entrada", details: getErrorMessage(error) });
    }
  }

  if (req.method === "DELETE") {
    try {
      const { id } = await readBody(req);
      await deleteEntry(id);
      return json(res, 200, { ok: true });
    } catch (error) {
      return json(res, 500, { error: "Falha ao deletar entrada", details: getErrorMessage(error) });
    }
  }

  return json(res, 405, { error: "Método não permitido" });
}
