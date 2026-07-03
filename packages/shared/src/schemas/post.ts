import { z } from "zod";
import { optionalCoerced } from "./common";
import { RoleSchema } from "./user";

export const PostSchema = z.object({
  id: z.string().uuid(),
  authorId: z.string().uuid(),
  authorFirstName: z.string(),
  authorLastName: z.string(),
  authorRole: RoleSchema,
  authorAvatarUrl: z.string().nullable(),
  content: z.string(),
  imageUrl: z.string().nullable(),
  likeCount: z.number().int(),
  commentCount: z.number().int(),
  isLikedByMe: z.boolean(),
  isMine: z.boolean(),
  createdAt: z.string(),
});
export type Post = z.infer<typeof PostSchema>;

export const ListPostsInputSchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});
export type ListPostsInput = z.infer<typeof ListPostsInputSchema>;

export const ListPostsResultSchema = z.object({
  items: z.array(PostSchema),
  total: z.number().int(),
});
export type ListPostsResult = z.infer<typeof ListPostsResultSchema>;

export const CreatePostInputSchema = z.object({
  content: z.string().trim().min(1, "Paylaşım metni zorunlu").max(3000),
  imageUrl: optionalCoerced(z.string().min(1).max(500)),
});
export type CreatePostInput = z.infer<typeof CreatePostInputSchema>;

export const DeletePostInputSchema = z.object({
  id: z.string().uuid(),
});
export type DeletePostInput = z.infer<typeof DeletePostInputSchema>;

export const TogglePostLikeInputSchema = z.object({
  postId: z.string().uuid(),
});
export type TogglePostLikeInput = z.infer<typeof TogglePostLikeInputSchema>;

export const TogglePostLikeResultSchema = z.object({
  liked: z.boolean(),
  likeCount: z.number().int(),
});
export type TogglePostLikeResult = z.infer<typeof TogglePostLikeResultSchema>;

export const PostCommentSchema = z.object({
  id: z.string().uuid(),
  postId: z.string().uuid(),
  authorId: z.string().uuid(),
  authorFirstName: z.string(),
  authorLastName: z.string(),
  content: z.string(),
  createdAt: z.string(),
});
export type PostComment = z.infer<typeof PostCommentSchema>;

export const ListPostCommentsInputSchema = z.object({
  postId: z.string().uuid(),
});
export type ListPostCommentsInput = z.infer<typeof ListPostCommentsInputSchema>;

export const CreatePostCommentInputSchema = z.object({
  postId: z.string().uuid(),
  content: z.string().trim().min(1, "Yorum boş olamaz").max(1000),
});
export type CreatePostCommentInput = z.infer<typeof CreatePostCommentInputSchema>;
