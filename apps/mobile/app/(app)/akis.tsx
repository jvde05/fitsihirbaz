import { useState } from "react";
import { ActivityIndicator, FlatList, Image, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { trpc } from "@/lib/trpc";
import { useAuthStore } from "@/lib/auth-store";
import { resolveMediaUrl, uploadImageAsset } from "@/lib/uploads";
import type { Post } from "@fit-sihirbaz/shared";

const PAGE_SIZE = 10;

const ROLE_LABELS: Record<string, string> = {
  CLIENT: "Danışan",
  DIETITIAN: "Diyetisyen",
  ADMIN: "Yönetici",
};

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("tr-TR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
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

  async function handlePickImage() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError("Fotoğraf seçmek için galeri izni gerekiyor");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) {
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const accessToken = useAuthStore.getState().accessToken;
      const url = await uploadImageAsset(result.assets[0], accessToken, "post");
      setImageUrl(url);
    } catch {
      setError("Fotoğraf yüklenemedi");
    } finally {
      setUploading(false);
    }
  }

  function handleSubmit() {
    if (!content.trim()) {
      return;
    }
    createMutation.mutate({ content: content.trim(), imageUrl: imageUrl ?? undefined });
  }

  return (
    <View style={styles.composer}>
      <TextInput
        testID="post-content-input"
        style={styles.composerInput}
        placeholder="Aklından ne geçiyor?"
        value={content}
        onChangeText={setContent}
        multiline
      />
      {imageUrl && (
        <View style={styles.composerImageWrap}>
          <Image source={{ uri: resolveMediaUrl(imageUrl) }} style={styles.composerImage} />
          <Pressable testID="remove-image-button" style={styles.removeImageButton} onPress={() => setImageUrl(null)}>
            <Text style={styles.removeImageButtonText}>Kaldır</Text>
          </Pressable>
        </View>
      )}
      {error && <Text style={styles.errorText}>{error}</Text>}
      <View style={styles.composerActions}>
        <Pressable testID="pick-image-button" onPress={handlePickImage} disabled={uploading}>
          <Text style={styles.pickImageText}>{uploading ? "Yükleniyor..." : "Fotoğraf Ekle"}</Text>
        </Pressable>
        <Pressable
          testID="submit-post-button"
          style={[styles.submitButton, (!content.trim() || uploading) && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={!content.trim() || uploading || createMutation.isPending}
        >
          <Text style={styles.submitButtonText}>Paylaş</Text>
        </Pressable>
      </View>
    </View>
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
    <View style={styles.commentsSection}>
      {commentsQuery.data?.map((comment) => (
        <View key={comment.id} style={styles.commentBubble}>
          <Text style={styles.commentAuthor}>
            {comment.authorFirstName} {comment.authorLastName}:{" "}
          </Text>
          <Text style={styles.commentText}>{comment.content}</Text>
        </View>
      ))}
      <View style={styles.commentComposer}>
        <TextInput
          testID={`comment-input-${postId}`}
          style={styles.commentInput}
          placeholder="Yorum yaz..."
          value={commentText}
          onChangeText={setCommentText}
        />
        <Pressable
          testID={`send-comment-${postId}`}
          style={styles.commentSendButton}
          onPress={() => {
            if (!commentText.trim()) return;
            commentMutation.mutate({ postId, content: commentText.trim() });
          }}
        >
          <Text style={styles.commentSendButtonText}>Gönder</Text>
        </Pressable>
      </View>
    </View>
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
    <View style={styles.postCard} testID={`post-${post.id}`}>
      <View style={styles.postHeader}>
        <View>
          <Text style={styles.postAuthor}>
            {post.authorFirstName} {post.authorLastName}
            <Text style={styles.postRoleBadge}> · {ROLE_LABELS[post.authorRole] ?? post.authorRole}</Text>
          </Text>
          <Text style={styles.postDate}>{formatDateTime(post.createdAt)}</Text>
        </View>
        {post.isMine && (
          <Pressable testID={`delete-post-${post.id}`} onPress={() => deleteMutation.mutate({ id: post.id })}>
            <Text style={styles.deleteText}>Sil</Text>
          </Pressable>
        )}
      </View>
      <Text style={styles.postContent}>{post.content}</Text>
      {post.imageUrl && <Image source={{ uri: resolveMediaUrl(post.imageUrl) }} style={styles.postImage} />}
      <View style={styles.postActions}>
        <Pressable testID={`like-post-${post.id}`} onPress={() => likeMutation.mutate({ postId: post.id })}>
          <Text style={post.isLikedByMe ? styles.likeActive : styles.likeInactive}>
            Beğen{post.likeCount > 0 ? ` (${post.likeCount})` : ""}
          </Text>
        </Pressable>
        <Pressable testID={`toggle-comments-${post.id}`} onPress={() => setShowComments((v) => !v)}>
          <Text style={styles.commentToggle}>
            Yorum Yap{post.commentCount > 0 ? ` (${post.commentCount})` : ""}
          </Text>
        </Pressable>
      </View>
      {showComments && <PostComments postId={post.id} />}
    </View>
  );
}

export default function AkisScreen() {
  const [limit, setLimit] = useState(PAGE_SIZE);
  const feedQuery = trpc.posts.list.useQuery({ limit });

  const items = feedQuery.data?.items ?? [];
  const hasMore = feedQuery.data ? items.length < feedQuery.data.total : false;

  return (
    <FlatList<Post>
      data={items}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.listContent}
      ListHeaderComponent={
        <View style={styles.header}>
          <Text style={styles.title}>Akış</Text>
          <PostComposer onCreated={() => feedQuery.refetch()} />
        </View>
      }
      ListEmptyComponent={
        feedQuery.isLoading ? (
          <ActivityIndicator style={styles.loading} />
        ) : (
          <Text style={styles.emptyText}>Henüz paylaşım yok. İlk paylaşımı sen yap!</Text>
        )
      }
      renderItem={({ item }) => <PostCard post={item} onDeleted={() => feedQuery.refetch()} />}
      ListFooterComponent={
        hasMore ? (
          <Pressable
            testID="load-more-posts"
            style={styles.loadMoreButton}
            onPress={() => setLimit((current) => current + PAGE_SIZE)}
          >
            <Text style={styles.loadMoreButtonText}>Daha Fazla Yükle</Text>
          </Pressable>
        ) : null
      }
    />
  );
}

const styles = StyleSheet.create({
  listContent: { padding: 16, gap: 12 },
  header: { gap: 12, marginBottom: 4 },
  title: { fontSize: 22, fontWeight: "600" },
  loading: { marginTop: 24 },
  emptyText: { color: "#9ca3af", fontSize: 13, marginTop: 12 },
  composer: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  composerInput: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    minHeight: 60,
    textAlignVertical: "top",
  },
  composerImageWrap: { alignSelf: "flex-start" },
  composerImage: { width: 160, height: 160, borderRadius: 8 },
  removeImageButton: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  removeImageButtonText: { color: "#fff", fontSize: 11 },
  errorText: { color: "#dc2626", fontSize: 13 },
  composerActions: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  pickImageText: { color: "#047857", fontWeight: "500", fontSize: 13 },
  submitButton: { backgroundColor: "#059669", borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8 },
  submitButtonDisabled: { opacity: 0.5 },
  submitButtonText: { color: "#fff", fontWeight: "600" },
  postCard: { borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 8, padding: 12, gap: 8 },
  postHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  postAuthor: { fontSize: 14, fontWeight: "600", color: "#111827" },
  postRoleBadge: { fontSize: 12, fontWeight: "400", color: "#6b7280" },
  postDate: { fontSize: 12, color: "#9ca3af" },
  deleteText: { fontSize: 12, color: "#dc2626" },
  postContent: { fontSize: 14, color: "#1f2937" },
  postImage: { width: "100%", height: 220, borderRadius: 8, marginTop: 4 },
  postActions: {
    flexDirection: "row",
    gap: 20,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
    paddingTop: 8,
  },
  likeActive: { fontSize: 13, fontWeight: "600", color: "#047857" },
  likeInactive: { fontSize: 13, color: "#6b7280" },
  commentToggle: { fontSize: 13, color: "#6b7280" },
  commentsSection: { gap: 6, borderTopWidth: 1, borderTopColor: "#f3f4f6", paddingTop: 8 },
  commentBubble: { backgroundColor: "#f9fafb", borderRadius: 8, padding: 8 },
  commentAuthor: { fontSize: 13, fontWeight: "600", color: "#111827" },
  commentText: { fontSize: 13, color: "#374151" },
  commentComposer: { flexDirection: "row", gap: 8 },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  commentSendButton: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 12,
    justifyContent: "center",
  },
  commentSendButtonText: { fontSize: 13, color: "#374151" },
  loadMoreButton: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
    marginTop: 4,
  },
  loadMoreButtonText: { fontSize: 13, fontWeight: "500", color: "#374151" },
});
