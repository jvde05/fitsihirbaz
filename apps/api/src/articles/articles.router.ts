import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  ArticleDetailSchema,
  ArticleSummarySchema,
  CreateArticleInputSchema,
  ListArticlesInputSchema,
  ListArticlesResultSchema,
  PublishArticleInputSchema,
} from "@fit-sihirbaz/shared";
import { dietitianOrAdminProcedure, publicProcedure, router } from "../trpc/trpc";
import type { ArticlesService } from "./articles.service";
import { ArticleAccessDeniedError, ArticleNotFoundError, SlugAlreadyExistsError } from "./articles.errors";

function mapArticleError(error: unknown): never {
  if (error instanceof ArticleNotFoundError) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Makale bulunamadı" });
  }
  if (error instanceof ArticleAccessDeniedError) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Bu makaleyi yayınlama yetkiniz yok" });
  }
  if (error instanceof SlugAlreadyExistsError) {
    throw new TRPCError({ code: "CONFLICT", message: "Bu slug zaten kullanılıyor" });
  }
  throw error;
}

export function createArticlesRouter(service: ArticlesService) {
  return router({
    list: publicProcedure
      .input(ListArticlesInputSchema)
      .output(ListArticlesResultSchema)
      .query(({ input }) => service.list(input)),

    getBySlug: publicProcedure
      .input(z.object({ slug: z.string() }))
      .output(ArticleDetailSchema)
      .query(async ({ input }) => {
        try {
          return await service.getBySlug(input.slug);
        } catch (error) {
          mapArticleError(error);
        }
      }),

    create: dietitianOrAdminProcedure
      .input(CreateArticleInputSchema)
      .output(ArticleDetailSchema)
      .mutation(async ({ ctx, input }) => {
        try {
          return await service.create(ctx.user.id, input);
        } catch (error) {
          mapArticleError(error);
        }
      }),

    publish: dietitianOrAdminProcedure
      .input(PublishArticleInputSchema)
      .output(ArticleDetailSchema)
      .mutation(async ({ ctx, input }) => {
        try {
          return await service.publish(ctx.user.id, ctx.user.role === "ADMIN", input.id);
        } catch (error) {
          mapArticleError(error);
        }
      }),

    listMine: dietitianOrAdminProcedure.output(z.array(ArticleSummarySchema)).query(({ ctx }) =>
      service.listMine(ctx.user.id),
    ),
  });
}
