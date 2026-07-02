import { z } from "zod";

const slugSchema = z
  .string()
  .min(3, "Slug en az 3 karakter olmalı")
  .max(200)
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Slug yalnızca küçük harf, rakam ve tire içerebilir");

export const ArticleSummarySchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  slug: z.string(),
  tags: z.array(z.string()),
  publishedAt: z.string().nullable(),
  authorFirstName: z.string(),
  authorLastName: z.string(),
});
export type ArticleSummary = z.infer<typeof ArticleSummarySchema>;

export const ArticleDetailSchema = ArticleSummarySchema.extend({
  body: z.string(),
  sourceCitations: z.array(z.string()),
});
export type ArticleDetail = z.infer<typeof ArticleDetailSchema>;

export const ListArticlesInputSchema = z.object({
  tag: z.string().min(1).max(50).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});
export type ListArticlesInput = z.infer<typeof ListArticlesInputSchema>;

export const ListArticlesResultSchema = z.object({
  items: z.array(ArticleSummarySchema),
  total: z.number().int(),
});
export type ListArticlesResult = z.infer<typeof ListArticlesResultSchema>;

export const CreateArticleInputSchema = z.object({
  title: z.string().min(1, "Başlık zorunlu").max(200),
  slug: slugSchema,
  body: z.string().min(1, "İçerik zorunlu"),
  tags: z.array(z.string().min(1).max(50)).max(20).optional(),
  sourceCitations: z.array(z.string().min(1).max(500)).max(20).optional(),
});
export type CreateArticleInput = z.infer<typeof CreateArticleInputSchema>;

export const PublishArticleInputSchema = z.object({
  id: z.string().uuid(),
});
export type PublishArticleInput = z.infer<typeof PublishArticleInputSchema>;
