export type Post = {
  id: number;
  titulo: string;
  conteudo: string;
  autor: string;
  criado_em: string;
};

export async function fetchPosts(): Promise<Post[]> {
  const response = await fetch("/api/posts");

  if (!response.ok) {
    throw new Error("Não foi possível carregar os posts.");
  }

  return response.json();
}

export async function createPost(input: Omit<Post, "id" | "criado_em">): Promise<Post> {
  const response = await fetch("/api/posts", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error("Não foi possível criar o post.");
  }

  return response.json();
}
