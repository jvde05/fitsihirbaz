import { Injectable } from "@nestjs/common";
import type {
  CreatePostCommentInput,
  CreatePostInput,
  ListPostsInput,
  ListPostsResult,
  Post,
  PostComment,
  TogglePostLikeResult,
} from "@fit-sihirbaz/shared";
import { PrismaService } from "../prisma/prisma.service";
import { PostAccessDeniedError, PostNotFoundError } from "./posts.errors";
import { toPost, toPostComment } from "./posts.mapper";

function postInclude(viewerId: string) {
  return {
    author: true,
    likes: { where: { userId: viewerId }, select: { id: true } },
    _count: { select: { likes: true, comments: true } },
  } as const;
}

@Injectable()
export class PostsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(viewerId: string, input: ListPostsInput): Promise<ListPostsResult> {
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.post.findMany({
        include: postInclude(viewerId),
        orderBy: { createdAt: "desc" },
        take: input.limit,
        skip: input.offset,
      }),
      this.prisma.post.count(),
    ]);
    return { items: rows.map((row) => toPost(row, viewerId)), total };
  }

  async create(authorId: string, input: CreatePostInput): Promise<Post> {
    const post = await this.prisma.post.create({
      data: { authorId, content: input.content, imageUrl: input.imageUrl ?? null },
      include: postInclude(authorId),
    });
    return toPost(post, authorId);
  }

  async delete(userId: string, isAdmin: boolean, postId: string): Promise<void> {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) {
      throw new PostNotFoundError();
    }
    if (post.authorId !== userId && !isAdmin) {
      throw new PostAccessDeniedError();
    }
    await this.prisma.post.delete({ where: { id: postId } });
  }

  async toggleLike(userId: string, postId: string): Promise<TogglePostLikeResult> {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) {
      throw new PostNotFoundError();
    }

    const existing = await this.prisma.postLike.findUnique({
      where: { postId_userId: { postId, userId } },
    });

    if (existing) {
      await this.prisma.postLike.delete({ where: { id: existing.id } });
    } else {
      await this.prisma.postLike.create({ data: { postId, userId } });
    }

    const likeCount = await this.prisma.postLike.count({ where: { postId } });
    return { liked: !existing, likeCount };
  }

  async listComments(postId: string): Promise<PostComment[]> {
    const comments = await this.prisma.postComment.findMany({
      where: { postId },
      include: { author: true },
      orderBy: { createdAt: "asc" },
    });
    return comments.map(toPostComment);
  }

  async addComment(authorId: string, input: CreatePostCommentInput): Promise<PostComment> {
    const post = await this.prisma.post.findUnique({ where: { id: input.postId } });
    if (!post) {
      throw new PostNotFoundError();
    }
    const comment = await this.prisma.postComment.create({
      data: { postId: input.postId, authorId, content: input.content },
      include: { author: true },
    });
    return toPostComment(comment);
  }
}
