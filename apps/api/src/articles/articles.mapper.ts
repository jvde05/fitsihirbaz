import type { Article as ArticleRow, User } from "@fit-sihirbaz/db";
import type { ArticleDetail, ArticleSummary } from "@fit-sihirbaz/shared";

type ArticleWithAuthor = ArticleRow & { author: User };

export function toArticleSummary(row: ArticleWithAuthor): ArticleSummary {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    tags: row.tags,
    publishedAt: row.publishedAt ? row.publishedAt.toISOString() : null,
    authorFirstName: row.author.firstName,
    authorLastName: row.author.lastName,
  };
}

export function toArticleDetail(row: ArticleWithAuthor): ArticleDetail {
  return {
    ...toArticleSummary(row),
    body: row.body,
    sourceCitations: row.sourceCitations,
  };
}
