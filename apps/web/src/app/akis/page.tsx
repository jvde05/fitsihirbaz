"use client";

import { useState } from "react";
import { Heart, ImagePlus, MessageCircle, Trash2 } from "lucide-react";
import type { Post } from "@fit-sihirbaz/shared";
import { trpc } from "@/lib/trpc";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { resolveMediaUrl } from "@/lib/media";
import { uploadImage } from "@/lib/uploads";
import { QueryErrorNotice } from "@/components/QueryErrorNotice";
import { EmptyState } from "@/components/EmptyState";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 10;

const ROLE_LABELS: Record<string, string> = {
  CLIENT: "Danışan",
  DIETITIAN: "Diyetisyen",
  ADMIN: "Yönetici",
};

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
      const url = await uploadImage(file, "post");
      setImageUrl(url);
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
    <Card className="mb-6 p-4">
      <form onSubmit={handleSubmit}>
        <Textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="Aklından ne geçiyor?"
          rows={3}
          className="resize-none"
        />
        {imageUrl && (
          <div className="relative mt-2 inline-block">
            <img src={resolveMediaUrl(imageUrl) ?? undefined} alt="" className="max-h-64 rounded-md object-cover" />
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="absolute right-2 top-2"
              onClick={() => setImageUrl(null)}
            >
              Kaldır
            </Button>
          </div>
        )}
        {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
        <div className="mt-3 flex items-center justify-between">
          <label className="flex cursor-pointer items-center gap-1.5 text-sm text-primary hover:underline">
            <ImagePlus className="h-4 w-4" />
            {uploading ? "Yükleniyor..." : "Fotoğraf Ekle"}
            <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} disabled={uploading} />
          </label>
          <Button type="submit" disabled={createMutation.isPending || uploading || !content.trim()}>
            Paylaş
          </Button>
        </div>
      </form>
    </Card>
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
    <div className="mt-3 space-y-2 border-t pt-3">
      {commentsQuery.data?.map((comment) => (
        <div key={comment.id} className="rounded-md bg-muted px-3 py-2 text-sm">
          <span className="font-medium text-foreground">
            {comment.authorFirstName} {comment.authorLastName}:{" "}
          </span>
          <span className="text-foreground/90">{comment.content}</span>
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
        <Input
          value={commentText}
          onChange={(event) => setCommentText(event.target.value)}
          placeholder="Yorum yaz..."
          className="flex-1"
        />
        <Button type="submit" variant="outline" size="sm" disabled={commentMutation.isPending || !commentText.trim()}>
          Gönder
        </Button>
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
    <Card className="mb-4 p-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <p className="font-medium text-foreground">
              {post.authorFirstName} {post.authorLastName}
            </p>
            <Badge variant="secondary">{ROLE_LABELS[post.authorRole] ?? post.authorRole}</Badge>
          </div>
          <p className="text-xs text-muted-foreground">{new Date(post.createdAt).toLocaleString("tr-TR")}</p>
        </div>
        {post.isMine && (
          <button
            type="button"
            onClick={() => deleteMutation.mutate({ id: post.id })}
            className="text-muted-foreground hover:text-destructive"
            aria-label="Sil"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
      <p className="mt-3 whitespace-pre-wrap text-sm text-foreground/90">{post.content}</p>
      {post.imageUrl && (
        <img
          src={resolveMediaUrl(post.imageUrl) ?? undefined}
          alt=""
          className="mt-3 max-h-96 w-full rounded-md object-cover"
        />
      )}
      <div className="mt-3 flex items-center gap-4 border-t pt-3 text-sm">
        <button
          type="button"
          onClick={() => likeMutation.mutate({ postId: post.id })}
          className={cn(
            "flex items-center gap-1.5",
            post.isLikedByMe ? "font-medium text-primary" : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Heart className={cn("h-4 w-4", post.isLikedByMe && "fill-primary")} />
          Beğen{post.likeCount > 0 && ` (${post.likeCount})`}
        </button>
        <button
          type="button"
          onClick={() => setShowComments((value) => !value)}
          className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
        >
          <MessageCircle className="h-4 w-4" />
          Yorum Yap{post.commentCount > 0 && ` (${post.commentCount})`}
        </button>
      </div>
      {showComments && <PostComments postId={post.id} />}
    </Card>
  );
}

function AkisContent() {
  const [limit, setLimit] = useState(PAGE_SIZE);
  const feedQuery = trpc.posts.list.useQuery({ limit });

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="mb-6 text-2xl font-semibold text-foreground">Akış</h1>

      <PostComposer onCreated={() => feedQuery.refetch()} />

      {feedQuery.isLoading && <p className="text-muted-foreground">Yükleniyor...</p>}
      {feedQuery.isError && (
        <QueryErrorNotice message={feedQuery.error.message} onRetry={() => feedQuery.refetch()} />
      )}
      {feedQuery.data && feedQuery.data.items.length === 0 && (
        <EmptyState title="Henüz paylaşım yok" description="İlk paylaşımı sen yap!" />
      )}

      {feedQuery.data?.items.map((post) => (
        <PostCard key={post.id} post={post} onDeleted={() => feedQuery.refetch()} />
      ))}

      {feedQuery.data && feedQuery.data.items.length < feedQuery.data.total && (
        <Button variant="outline" className="mt-2 w-full" onClick={() => setLimit((current) => current + PAGE_SIZE)}>
          Daha Fazla Yükle
        </Button>
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
