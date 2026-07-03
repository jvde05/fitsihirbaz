import { PostsService } from "./posts.service";
import { PrismaService } from "../prisma/prisma.service";
import { PostAccessDeniedError, PostNotFoundError } from "./posts.errors";

function buildPostRow(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "post-1",
    authorId: "user-1",
    content: "Merhaba akış!",
    imageUrl: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    author: { id: "user-1", firstName: "Ayşe", lastName: "Yılmaz", role: "DIETITIAN", avatarUrl: null },
    likes: [],
    _count: { likes: 0, comments: 0 },
    ...overrides,
  };
}

function buildCommentRow(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "comment-1",
    postId: "post-1",
    authorId: "user-2",
    content: "Harika!",
    createdAt: new Date(),
    author: { id: "user-2", firstName: "Can", lastName: "Öztürk" },
    ...overrides,
  };
}

describe("PostsService", () => {
  let prisma: {
    post: { findMany: jest.Mock; count: jest.Mock; create: jest.Mock; findUnique: jest.Mock; delete: jest.Mock };
    postLike: { findUnique: jest.Mock; create: jest.Mock; delete: jest.Mock; count: jest.Mock };
    postComment: { findMany: jest.Mock; create: jest.Mock };
    $transaction: jest.Mock;
  };
  let service: PostsService;

  beforeEach(() => {
    prisma = {
      post: { findMany: jest.fn(), count: jest.fn(), create: jest.fn(), findUnique: jest.fn(), delete: jest.fn() },
      postLike: { findUnique: jest.fn(), create: jest.fn(), delete: jest.fn(), count: jest.fn() },
      postComment: { findMany: jest.fn(), create: jest.fn() },
      $transaction: jest.fn((ops: unknown[]) => Promise.all(ops as Promise<unknown>[])),
    };
    service = new PostsService(prisma as unknown as PrismaService);
  });

  describe("list", () => {
    it("akışı isLikedByMe ile birlikte döner", async () => {
      prisma.post.findMany.mockResolvedValue([buildPostRow({ likes: [{ id: "like-1" }] })]);
      prisma.post.count.mockResolvedValue(1);
      const result = await service.list("user-1", { limit: 20, offset: 0 });
      expect(result.total).toBe(1);
      expect(result.items[0].isLikedByMe).toBe(true);
      expect(result.items[0].isMine).toBe(true);
    });
  });

  describe("create", () => {
    it("yeni paylaşım oluşturur", async () => {
      prisma.post.create.mockResolvedValue(buildPostRow());
      const result = await service.create("user-1", { content: "Merhaba akış!" });
      expect(result.content).toBe("Merhaba akış!");
      expect(result.isMine).toBe(true);
    });
  });

  describe("delete", () => {
    it("post yoksa PostNotFoundError fırlatır", async () => {
      prisma.post.findUnique.mockResolvedValue(null);
      await expect(service.delete("user-1", false, "post-1")).rejects.toBeInstanceOf(PostNotFoundError);
    });

    it("başka birinin postunu admin olmayan kullanıcı silemez", async () => {
      prisma.post.findUnique.mockResolvedValue({ id: "post-1", authorId: "other-user" });
      await expect(service.delete("user-1", false, "post-1")).rejects.toBeInstanceOf(PostAccessDeniedError);
    });

    it("admin başkasının postunu silebilir", async () => {
      prisma.post.findUnique.mockResolvedValue({ id: "post-1", authorId: "other-user" });
      await service.delete("admin-1", true, "post-1");
      expect(prisma.post.delete).toHaveBeenCalledWith({ where: { id: "post-1" } });
    });
  });

  describe("toggleLike", () => {
    it("post yoksa PostNotFoundError fırlatır", async () => {
      prisma.post.findUnique.mockResolvedValue(null);
      await expect(service.toggleLike("user-1", "post-1")).rejects.toBeInstanceOf(PostNotFoundError);
    });

    it("beğeni yoksa oluşturur ve liked=true döner", async () => {
      prisma.post.findUnique.mockResolvedValue({ id: "post-1" });
      prisma.postLike.findUnique.mockResolvedValue(null);
      prisma.postLike.count.mockResolvedValue(1);
      const result = await service.toggleLike("user-1", "post-1");
      expect(prisma.postLike.create).toHaveBeenCalledWith({ data: { postId: "post-1", userId: "user-1" } });
      expect(result).toEqual({ liked: true, likeCount: 1 });
    });

    it("beğeni varsa kaldırır ve liked=false döner", async () => {
      prisma.post.findUnique.mockResolvedValue({ id: "post-1" });
      prisma.postLike.findUnique.mockResolvedValue({ id: "like-1" });
      prisma.postLike.count.mockResolvedValue(0);
      const result = await service.toggleLike("user-1", "post-1");
      expect(prisma.postLike.delete).toHaveBeenCalledWith({ where: { id: "like-1" } });
      expect(result).toEqual({ liked: false, likeCount: 0 });
    });
  });

  describe("addComment", () => {
    it("post yoksa PostNotFoundError fırlatır", async () => {
      prisma.post.findUnique.mockResolvedValue(null);
      await expect(service.addComment("user-2", { postId: "post-1", content: "Harika!" })).rejects.toBeInstanceOf(
        PostNotFoundError,
      );
    });

    it("yorum oluşturur", async () => {
      prisma.post.findUnique.mockResolvedValue({ id: "post-1" });
      prisma.postComment.create.mockResolvedValue(buildCommentRow());
      const result = await service.addComment("user-2", { postId: "post-1", content: "Harika!" });
      expect(result.content).toBe("Harika!");
      expect(result.authorFirstName).toBe("Can");
    });
  });

  describe("listComments", () => {
    it("post yorumlarını döner", async () => {
      prisma.postComment.findMany.mockResolvedValue([buildCommentRow()]);
      const result = await service.listComments("post-1");
      expect(result).toHaveLength(1);
      expect(result[0].authorFirstName).toBe("Can");
    });
  });
});
