const EDGE_CONFIG_KEY = "finance_state";
const EDGE_CONFIG_API_BASE_URL = "https://api.vercel.com/v1/edge-config";

type JsonObject = Record<string, unknown>;

interface ApiResponse {
  state: JsonObject | null;
  source: "edge-config";
}

function getEdgeConfigConnectionString() {
  return process.env.EDGE_CONFIG;
}

function getManagementCredentials() {
  return {
    id: process.env.EDGE_CONFIG_ID,
    token: process.env.EDGE_CONFIG_TOKEN,
  };
}

function buildReadUrl(connectionString: string) {
  return `${connectionString.replace(/\/$/, "")}/item/${EDGE_CONFIG_KEY}`;
}

async function readStateFromEdgeConfig(): Promise<JsonObject | null> {
  const connectionString = getEdgeConfigConnectionString();
  if (!connectionString) {
    throw new Error("Variável EDGE_CONFIG não configurada.");
  }

  const response = await fetch(buildReadUrl(connectionString), {
    method: "GET",
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  if (response.status === 404) return null;
  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Falha ao ler Edge Config (${response.status}): ${details}`);
  }

  return (await response.json()) as JsonObject | null;
}

async function writeStateToEdgeConfig(state: JsonObject) {
  const { id, token } = getManagementCredentials();

  if (!id || !token) {
    throw new Error("EDGE_CONFIG_ID e EDGE_CONFIG_TOKEN são obrigatórios para escrita.");
  }

  const response = await fetch(`${EDGE_CONFIG_API_BASE_URL}/${id}/items`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      items: [
        {
          operation: "upsert",
          key: EDGE_CONFIG_KEY,
          value: state,
        },
      ],
    }),
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Falha ao salvar Edge Config (${response.status}): ${details}`);
  }
}

function jsonResponse(body: unknown, status = 200) {
  return Response.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

export const config = {
  runtime: "edge",
};

export default async function handler(request: Request): Promise<Response> {
  try {
    if (request.method === "GET") {
      const state = await readStateFromEdgeConfig();
      const payload: ApiResponse = {
        state,
        source: "edge-config",
      };
      return jsonResponse(payload, 200);
    }

    if (request.method === "POST") {
      const body = (await request.json()) as { state?: unknown };
      if (!body || typeof body.state !== "object" || body.state === null) {
        return jsonResponse({ error: "Campo 'state' deve ser um objeto JSON." }, 400);
      }

      await writeStateToEdgeConfig(body.state as JsonObject);
      return jsonResponse({ ok: true }, 200);
    }

    return jsonResponse({ error: "Método não suportado." }, 405);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro interno.";
    return jsonResponse({ error: message }, 500);
  }
}
