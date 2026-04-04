const EDGE_CONFIG_KEY = "finance_state";
const API_BASE_URL = "https://api.vercel.com/v1/edge-config";

function getConnectionString() {
  return process.env.EDGE_CONFIG;
}

function getManagementCredentials() {
  return {
    id: process.env.EDGE_CONFIG_ID,
    token: process.env.EDGE_CONFIG_TOKEN,
  };
}

async function readEdgeConfigItem() {
  const connectionString = getConnectionString();
  if (!connectionString) return null;

  const response = await fetch(`${connectionString}/item/${EDGE_CONFIG_KEY}`, {
    method: "GET",
    headers: { Accept: "application/json" },
  });

  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`Falha ao ler Edge Config: ${response.status}`);

  return response.json();
}

async function writeEdgeConfigItem(value: unknown) {
  const { id, token } = getManagementCredentials();
  if (!id || !token) {
    throw new Error("EDGE_CONFIG_ID e EDGE_CONFIG_TOKEN são obrigatórios para escrita.");
  }

  const response = await fetch(`${API_BASE_URL}/${id}/items`, {
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
          value,
        },
      ],
    }),
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Falha ao salvar Edge Config (${response.status}): ${details}`);
  }
}

export const config = {
  runtime: "edge",
};

export default async function handler(request: Request): Promise<Response> {
  try {
    if (request.method === "GET") {
      const state = await readEdgeConfigItem();
      return Response.json({ state }, { status: 200 });
    }

    if (request.method === "POST") {
      const body = (await request.json()) as { state?: unknown };
      if (!body?.state) {
        return Response.json({ error: "Campo 'state' é obrigatório." }, { status: 400 });
      }

      await writeEdgeConfigItem(body.state);
      return Response.json({ ok: true }, { status: 200 });
    }

    return Response.json({ error: "Método não suportado." }, { status: 405 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro interno";
    return Response.json({ error: message }, { status: 500 });
  }
}
