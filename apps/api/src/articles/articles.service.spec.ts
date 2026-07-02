import { ArticlesService } from "./articles.service";
import { PrismaService } from "../prisma/prisma.service";
import { ArticleAccessDeniedError, ArticleNotFoundError, SlugAlreadyExistsError } from "./articles.errors";

function buildArticleRow(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "article-1",
    title: "Protein İhtiyacı",
    slug: "protein-ihtiyaci",
    body: "İçerik...",
    authorId: "author-1",
    tags: ["beslenme"],
    sourceCitations: [],
    publishedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    author: { firstName: "Ayşe", lastName: "Yılmaz" },
    ...overrides,
  };
}

describe("ArticlesService", () => {
  let prisma: {
    article: { findMany: jest.Mock; count: jest.Mock; findUnique: jest.Mock; create: jest.Mock; update: jest.Mock };
    $transaction: jest.Mock;
  };
  let service: ArticlesService;

  beforeEach(() => {
    prisma = {
      article: { findMany: jest.fn(), count: jest.fn(), findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
      $transaction: jest.fn((ops: unknown[]) => Promise.all(ops)),
    };
    service = new ArticlesService(prisma as unknown as PrismaService);
  });

  describe("list", () => {
    it("yalnızca yayınlanmış makaleleri döner", async () => {
      prisma.article.findMany.mockResolvedValue([buildArticleRow({ publishedAt: new Date() })]);
      prisma.article.count.mockResolvedValue(1);

      const result = await service.list({ limit: 20, offset: 0 });
      expect(result.total).toBe(1);
      const whereArg = prisma.article.findMany.mock.calls[0][0].where;
      expect(whereArg.publishedAt).toEqual({ not: null });
    });
  });

  describe("getBySlug", () => {
    it("taslak (yayınlanmamış) makale için ArticleNotFoundError fırlatır", async () => {
      prisma.article.findUnique.mockResolvedValue(buildArticleRow({ publishedAt: null }));
      await expect(service.getBySlug("protein-ihtiyaci")).rejects.toBeInstanceOf(ArticleNotFoundError);
    });

    it("yayınlanmış makaleyi döner", async () => {
      prisma.article.findUnique.mockResolvedValue(buildArticleRow({ publishedAt: new Date() }));
      const result = await service.getBySlug("protein-ihtiyaci");
      expect(result.title).toBe("Protein İhtiyacı");
    });
  });

  describe("create", () => {
    it("slug zaten varsa SlugAlreadyExistsError fırlatır", async () => {
      prisma.article.findUnique.mockResolvedValue(buildArticleRow());
      await expect(
        service.create("author-1", { title: "T", slug: "protein-ihtiyaci", body: "..." }),
      ).rejects.toBeInstanceOf(SlugAlreadyExistsError);
      expect(prisma.article.create).not.toHaveBeenCalled();
    });
  });

  describe("publish", () => {
    it("başkasının makalesini admin olmayan kullanıcı yayınlayamaz", async () => {
      prisma.article.findUnique.mockResolvedValue(buildArticleRow({ authorId: "baska-author" }));
      await expect(service.publish("author-1", false, "article-1")).rejects.toBeInstanceOf(
        ArticleAccessDeniedError,
      );
    });

    it("admin başkasının makalesini yayınlayabilir", async () => {
      prisma.article.findUnique.mockResolvedValue(buildArticleRow({ authorId: "baska-author" }));
      prisma.article.update.mockResolvedValue(buildArticleRow({ publishedAt: new Date() }));

      const result = await service.publish("admin-1", true, "article-1");
      expect(result.publishedAt).not.toBeNull();
    });

    it("kendi makalesini yayınlayabilir", async () => {
      prisma.article.findUnique.mockResolvedValue(buildArticleRow({ authorId: "author-1" }));
      prisma.article.update.mockResolvedValue(buildArticleRow({ publishedAt: new Date() }));

      const result = await service.publish("author-1", false, "article-1");
      expect(result.publishedAt).not.toBeNull();
    });
  });

  describe("listAll", () => {
    it("yazardan bağımsız tüm makaleleri (taslak dahil) döner", async () => {
      prisma.article.findMany.mockResolvedValue([
        buildArticleRow({ id: "article-1", authorId: "author-1", publishedAt: null }),
        buildArticleRow({ id: "article-2", authorId: "author-2", publishedAt: new Date() }),
      ]);

      const result = await service.listAll();
      expect(result).toHaveLength(2);
      expect(prisma.article.findMany.mock.calls[0][0].where).toBeUndefined();
    });
  });
});
