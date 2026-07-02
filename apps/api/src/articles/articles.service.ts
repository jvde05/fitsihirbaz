import { Injectable } from "@nestjs/common";
import type { Prisma } from "@fit-sihirbaz/db";
import type {
  ArticleDetail,
  ArticleSummary,
  CreateArticleInput,
  ListArticlesInput,
  ListArticlesResult,
} from "@fit-sihirbaz/shared";
import { PrismaService } from "../prisma/prisma.service";
import { ArticleAccessDeniedError, ArticleNotFoundError, SlugAlreadyExistsError } from "./articles.errors";
import { toArticleDetail, toArticleSummary } from "./articles.mapper";

const AUTHOR_INCLUDE = { author: true } as const;

@Injectable()
export class ArticlesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(input: ListArticlesInput): Promise<ListArticlesResult> {
    const where: Prisma.ArticleWhereInput = {
      publishedAt: { not: null },
      ...(input.tag ? { tags: { has: input.tag } } : {}),
    };

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.article.findMany({
        where,
        include: AUTHOR_INCLUDE,
        orderBy: { publishedAt: "desc" },
        take: input.limit,
        skip: input.offset,
      }),
      this.prisma.article.count({ where }),
    ]);

    return { items: rows.map(toArticleSummary), total };
  }

  async getBySlug(slug: string): Promise<ArticleDetail> {
    const article = await this.prisma.article.findUnique({ where: { slug }, include: AUTHOR_INCLUDE });
    if (!article || !article.publishedAt) {
      throw new ArticleNotFoundError();
    }
    return toArticleDetail(article);
  }

  async create(authorId: string, input: CreateArticleInput): Promise<ArticleDetail> {
    const existing = await this.prisma.article.findUnique({ where: { slug: input.slug } });
    if (existing) {
      throw new SlugAlreadyExistsError();
    }

    const article = await this.prisma.article.create({
      data: {
        title: input.title,
        slug: input.slug,
        body: input.body,
        authorId,
        tags: input.tags ?? [],
        sourceCitations: input.sourceCitations ?? [],
      },
      include: AUTHOR_INCLUDE,
    });
    return toArticleDetail(article);
  }

  async publish(userId: string, isAdmin: boolean, articleId: string): Promise<ArticleDetail> {
    const article = await this.prisma.article.findUnique({ where: { id: articleId } });
    if (!article) {
      throw new ArticleNotFoundError();
    }
    if (article.authorId !== userId && !isAdmin) {
      throw new ArticleAccessDeniedError();
    }

    const updated = await this.prisma.article.update({
      where: { id: articleId },
      data: { publishedAt: new Date() },
      include: AUTHOR_INCLUDE,
    });
    return toArticleDetail(updated);
  }

  async listMine(authorId: string): Promise<ArticleSummary[]> {
    const articles = await this.prisma.article.findMany({
      where: { authorId },
      include: AUTHOR_INCLUDE,
      orderBy: { createdAt: "desc" },
    });
    return articles.map(toArticleSummary);
  }
}
