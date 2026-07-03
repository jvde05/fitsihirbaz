"use client";

import { useState } from "react";
import type { Post } from "@fit-sihirbaz/shared";
import { trpc } from "@/lib/trpc";
import { useAuthStore } from "@/lib/auth-store";
import { RequireAuth } from "@/components/auth/RequireAuth";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const PAGE_SIZE = 10;

const ROLE_LABELS: Record<string, string> = {
  CLIENT: "Danışan",
  DIETITIAN: "Diyetisyen",
  ADMIN: "Yönetici",
};

function resolveImageUrl(path: string) {
  return path.startsWith("http") ? path : `${API_URL}${path}`;
}

function PostComposer({ onCreated }: { onCreated: () => void }) {
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createMutation = trpc.posts.create.useMutation({
    onSuccess: () => {
      setContent("");
      setImageUrl(null);
      setError(null);
      onCreated();
    },
    onError: (err) => setError(err.message),
  });

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const accessToken = useAuthStore.getState().accessToken;
      const response = await fetch(`${API_URL}/uploads/image`, {
        method: "POST",
        body: formData,
        credentials: "include",
        headers: accessToken ? { authorization: `Bearer ${accessToken}` } : undefined,
      });
      if (!response.ok) {
        throw new Error("Fotoğraf yüklenemedi");
      }
      const data = (await response.json()) as { url: string };
      setImageUrl(data.url);
    } catch {
      setError("Fotoğraf yüklenemedi. Desteklenen türler: jpeg/png/webp/gif, maks 5MB.");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!content.trim()) {
      return;
    }
    await createMutation.mutateAsync({ content, imageUrl: imageUrl ?? undefined });
  }

  return (
    <form onSubmit={handleSubmit} className="mb-6 rounded-md border border-gray-200 p-4">
      <textarea
        value={content}
        onChange={(event) => setContent(event.target.value)}
        placeholder="Aklından ne geçiyor?"
        rows={3}
        className="w-full resize-none rounded-md border border-gray-300 px-3 py-2 text-sm"
      />
      {imageUrl && (
        <div className="relative mt-2 inline-block">
          <img src={resolveImageUrl(imageUrl)} alt="" className="max-h-64 rounded-md object-cover" />
          <button
            type="button"
            onClick={() => setImageUrl(null)}
            className="absolute right-2 top-2 rounded-full bg-black/60 px-2 py-1 text-xs text-white hover:bg-black/80"
          >
            Kaldır
          </button>
        </div>
      )}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      <div className="mt-3 flex items-center justify-between">
        <label className="cursor-pointer text-sm text-brand-700 hover:underline">
          {uploading ? "Yükleniyor..." : "Fotoğraf Ekle"}
          <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} disabled={uploading} />
        </label>
        <button
          type="submit"
          disabled={createMutation.isPending || uploading || !content.trim()}
          className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
        >
          Paylaş
        </button>
      </div>
    </form>
  );
}

function PostComments({ postId }: { postId: string }) {
  const utils = trpc.useUtils();
  const [commentText, setCommentText] = useState("");
  const commentsQuery = trpc.posts.listComments.useQuery({ postId });

  const commentMutation = trpc.posts.addComment.useMutation({
    onSuccess: () => {
      setCommentText("");
      utils.posts.listComments.invalidate({ postId });
      utils.posts.list.invalidate();
    },
  });

  return (
    <div className="mt-3 space-y-2 border-t border-gray-100 pt-3">
      {commentsQuery.data?.map((comment) => (
        <div key={comment.id} className="rounded-md bg-gray-50 px-3 py-2 text-sm">
          <span className="font-medium text-gray-900">
            {comment.authorFirstName} {comment.authorLastName}:{" "}
          </span>
          <span className="text-gray-700">{comment.content}</span>
        </div>
      ))}
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (!commentText.trim()) {
            return;
          }
          commentMutation.mutate({ postId, content: commentText });
        }}
        className="flex gap-2"
      >
        <input
          value={commentText}
          onChange={(event) => setCommentText(event.target.value)}
          placeholder="Yorum yaz..."
          className="flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm"
        />
        <button
          type="submit"
          disabled={commentMutation.isPending || !commentText.trim()}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
        >
          Gönder
        </button>
      </form>
    </div>
  );
}

function PostCard({ post, onDeleted }: { post: Post; onDeleted: () => void }) {
  const utils = trpc.useUtils();
  const [showComments, setShowComments] = useState(false);

  const likeMutation = trpc.posts.toggleLike.useMutation({
    onSuccess: () => utils.posts.list.invalidate(),
  });
  const deleteMutation = trpc.posts.delete.useMutation({
    onSuccess: () => onDeleted(),
  });

  return (
    <div className="mb-4 rounded-md border border-gray-200 p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-medium text-gray-900">
            {post.authorFirstName} {post.authorLastName}
            <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
              {ROLE_LABELS[post.authorRole] ?? post.authorRole}
            </span>
          </p>
          <p className="text-xs text-gray-400">{new Date(post.createdAt).toLocaleString("tr-TR")}</p>
        </div>
        {post.isMine && (
          <button
            type="button"
            onClick={() => deleteMutation.mutate({ id: post.id })}
            className="text-xs text-red-600 hover:underline"
          >
            Sil
          </button>
        )}
      </div>
      <p className="mt-3 whitespace-pre-wrap text-sm text-gray-800">{post.content}</p>
      {post.imageUrl && (
        <img
          src={resolveImageUrl(post.imageUrl)}
          alt=""
          className="mt-3 max-h-96 w-full rounded-md object-cover"
        />
      )}
      <div className="mt-3 flex items-center gap-4 border-t border-gray-100 pt-3 text-sm">
        <button
          type="button"
          onClick={() => likeMutation.mutate({ postId: post.id })}
          className={post.isLikedByMe ? "font-medium text-brand-700" : "text-gray-600 hover:text-gray-900"}
        >
          Beğen{post.likeCount > 0 && ` (${post.likeCount})`}
        </button>
        <button type="button" onClick={() => setShowComments((value) => !value)} className="text-gray-600 hover:text-gray-900">
          Yorum Yap{post.commentCount > 0 && ` (${post.commentCount})`}
        </button>
      </div>
      {showComments && <PostComments postId={post.id} />}
    </div>
  );
}

function AkisContent() {
  const [limit, setLimit] = useState(PAGE_SIZE);
  const feedQuery = trpc.posts.list.useQuery({ limit });

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="mb-6 text-2xl font-semibold text-gray-900">Akış</h1>

      <PostComposer onCreated={() => feedQuery.refetch()} />

      {feedQuery.isLoading && <p className="text-gray-500">Yükleniyor...</p>}
      {feedQuery.data && feedQuery.data.items.length === 0 && (
        <p className="text-gray-500">Henüz paylaşım yok. İlk paylaşımı sen yap!</p>
      )}

      {feedQuery.data?.items.map((post) => (
        <PostCard key={post.id} post={post} onDeleted={() => feedQuery.refetch()} />
      ))}

      {feedQuery.data && feedQuery.data.items.length < feedQuery.data.total && (
        <button
          type="button"
          onClick={() => setLimit((current) => current + PAGE_SIZE)}
          className="mt-2 w-full rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
        >
          Daha Fazla Yükle
        </button>
      )}
    </div>
  );
}

export default function AkisPage() {
  return (
    <RequireAuth>
      <AkisContent />
    </RequireAuth>
  );
}
