const GREETING_KEY = "greeting";

function getConnectionString() {
  return process.env.EDGE_CONFIG;
}

async function readGreeting() {
  const connectionString = getConnectionString();
  if (!connectionString) return null;

  const response = await fetch(`${connectionString}/item/${GREETING_KEY}`, {
    method: "GET",
    headers: { Accept: "application/json" },
  });

  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`Falha ao ler greeting no Edge Config: ${response.status}`);

  return response.json();
}

export const config = {
  runtime: "edge",
};

export default async function handler(): Promise<Response> {
  try {
    const greeting = await readGreeting();
    return Response.json({ greeting }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro interno";
    return Response.json({ error: message }, { status: 500 });
  }
}
