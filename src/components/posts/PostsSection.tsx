import { FormEvent, useEffect, useState } from "react";
import { createPost, fetchPosts, Post } from "@/lib/posts-api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function PostsSection() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [conteudo, setConteudo] = useState("");
  const [autor, setAutor] = useState("");
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    async function loadPosts() {
      try {
        const data = await fetchPosts();
        setPosts(data);
      } catch (error) {
        setErro(error instanceof Error ? error.message : "Erro ao carregar posts.");
      } finally {
        setLoading(false);
      }
    }

    loadPosts();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErro(null);

    try {
      setSaving(true);
      const novoPost = await createPost({ titulo, conteudo, autor });
      setPosts((current) => [novoPost, ...current]);
      setTitulo("");
      setConteudo("");
      setAutor("");
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Erro ao salvar post.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="space-y-4 mt-8">
      <Card>
        <CardHeader>
          <CardTitle>Novo post</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-3" onSubmit={handleSubmit}>
            <Input
              placeholder="Título"
              value={titulo}
              onChange={(event) => setTitulo(event.target.value)}
              required
            />
            <Textarea
              placeholder="Conteúdo"
              value={conteudo}
              onChange={(event) => setConteudo(event.target.value)}
              required
            />
            <Input
              placeholder="Autor"
              value={autor}
              onChange={(event) => setAutor(event.target.value)}
              required
            />
            <Button type="submit" disabled={saving}>
              {saving ? "Salvando..." : "Publicar"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Posts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading && <p className="text-sm text-muted-foreground">Carregando posts...</p>}

          {erro && <p className="text-sm text-destructive">{erro}</p>}

          {!loading && posts.length === 0 && <p className="text-sm text-muted-foreground">Nenhum post encontrado.</p>}

          {posts.map((post) => (
            <article key={post.id} className="rounded-md border p-3 space-y-1">
              <h3 className="font-semibold">{post.titulo}</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{post.conteudo}</p>
              <p className="text-xs text-muted-foreground">
                Por {post.autor} em {new Date(post.criado_em).toLocaleString("pt-BR")}
              </p>
            </article>
          ))}
        </CardContent>
      </Card>
    </section>
  );
}
