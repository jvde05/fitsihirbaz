import { TRPCError } from "@trpc/server";
import {
  CreatePostCommentInputSchema,
  CreatePostInputSchema,
  DeletePostInputSchema,
  ListPostCommentsInputSchema,
  ListPostsInputSchema,
  ListPostsResultSchema,
  PostCommentSchema,
  PostSchema,
  TogglePostLikeInputSchema,
  TogglePostLikeResultSchema,
} from "@fit-sihirbaz/shared";
import { z } from "zod";
import { protectedProcedure, router } from "../trpc/trpc";
import type { PostsService } from "./posts.service";
import { PostAccessDeniedError, PostNotFoundError } from "./posts.errors";

function mapPostError(error: unknown): never {
  if (error instanceof PostNotFoundError) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Paylaşım bulunamadı" });
  }
  if (error instanceof PostAccessDeniedError) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Bu paylaşımı silme yetkiniz yok" });
  }
  throw error;
}

export function createPostsRouter(service: PostsService) {
  return router({
    list: protectedProcedure
      .input(ListPostsInputSchema)
      .output(ListPostsResultSchema)
      .query(({ ctx, input }) => service.list(ctx.user.id, input)),

    create: protectedProcedure
      .input(CreatePostInputSchema)
      .output(PostSchema)
      .mutation(({ ctx, input }) => service.create(ctx.user.id, input)),

    delete: protectedProcedure
      .input(DeletePostInputSchema)
      .output(z.object({ success: z.literal(true) }))
      .mutation(async ({ ctx, input }) => {
        try {
          await service.delete(ctx.user.id, ctx.user.role === "ADMIN", input.id);
          return { success: true as const };
        } catch (error) {
          mapPostError(error);
        }
      }),

    toggleLike: protectedProcedure
      .input(TogglePostLikeInputSchema)
      .output(TogglePostLikeResultSchema)
      .mutation(async ({ ctx, input }) => {
        try {
          return await service.toggleLike(ctx.user.id, input.postId);
        } catch (error) {
          mapPostError(error);
        }
      }),

    listComments: protectedProcedure
      .input(ListPostCommentsInputSchema)
      .output(z.array(PostCommentSchema))
      .query(({ input }) => service.listComments(input.postId)),

    addComment: protectedProcedure
      .input(CreatePostCommentInputSchema)
      .output(PostCommentSchema)
      .mutation(async ({ ctx, input }) => {
        try {
          return await service.addComment(ctx.user.id, input);
        } catch (error) {
          mapPostError(error);
        }
      }),
  });
}
