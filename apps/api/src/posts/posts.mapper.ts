import type { Post as PostRow, PostComment as PostCommentRow, User } from "@fit-sihirbaz/db";
import type { Post, PostComment } from "@fit-sihirbaz/shared";

type PostWithRelations = PostRow & {
  author: User;
  likes: { id: string }[];
  _count: { likes: number; comments: number };
};

export function toPost(row: PostWithRelations, viewerId: string): Post {
  return {
    id: row.id,
    authorId: row.authorId,
    authorFirstName: row.author.firstName,
    authorLastName: row.author.lastName,
    authorRole: row.author.role,
    authorAvatarUrl: row.author.avatarUrl,
    content: row.content,
    imageUrl: row.imageUrl,
    likeCount: row._count.likes,
    commentCount: row._count.comments,
    isLikedByMe: row.likes.length > 0,
    isMine: row.authorId === viewerId,
    createdAt: row.createdAt.toISOString(),
  };
}

type PostCommentWithAuthor = PostCommentRow & { author: User };

export function toPostComment(row: PostCommentWithAuthor): PostComment {
  return {
    id: row.id,
    postId: row.postId,
    authorId: row.authorId,
    authorFirstName: row.author.firstName,
    authorLastName: row.author.lastName,
    content: row.content,
    createdAt: row.createdAt.toISOString(),
  };
}
