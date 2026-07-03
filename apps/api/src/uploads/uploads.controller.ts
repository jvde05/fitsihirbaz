import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import { extname, resolve } from "node:path";
import {
  BadRequestException,
  Controller,
  Post,
  Req,
  UnauthorizedException,
  UseInterceptors,
  UploadedFile,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { diskStorage } from "multer";
import type { Request } from "express";
import { TokenService } from "../auth/token.service";
import { resolveAuthedUser } from "../auth/resolve-authed-user";

const UPLOAD_BASE = resolve(__dirname, "../../uploads");
const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

const UPLOAD_FOLDERS = new Set(["avatars", "posts", "progress"]);

// ?kind=avatar -> uploads/avatars, ?kind=progress -> uploads/progress, aksi halde (varsayılan) uploads/posts.
function resolveUploadFolder(req: Request): string {
  const kind = req.query.kind;
  const folder = kind === "avatar" ? "avatars" : kind === "progress" ? "progress" : "posts";
  return UPLOAD_FOLDERS.has(folder) ? folder : "posts";
}

// Gerçek S3/R2 kimlik bilgileri henüz yok (bkz. .env). Bu endpoint dosyayı local diske
// yazar ve statik olarak /uploads altından servis eder (main.ts). İleride gerçek bir
// sağlayıcıya geçildiğinde sadece bu controller'ın disk yazma kısmı S3/R2 SDK çağrısıyla
// değiştirilir; geri kalan (auth kontrolü, dönen URL şekli) aynı kalır.
@Controller("uploads")
export class UploadsController {
  constructor(private readonly tokenService: TokenService) {}

  @Post("image")
  @UseInterceptors(
    FileInterceptor("file", {
      storage: diskStorage({
        destination: (req, _file, callback) => {
          const dir = resolve(UPLOAD_BASE, resolveUploadFolder(req as Request));
          mkdirSync(dir, { recursive: true });
          callback(null, dir);
        },
        filename: (_req, file, callback) => {
          callback(null, `${randomUUID()}${extname(file.originalname).toLowerCase()}`);
        },
      }),
      limits: { fileSize: MAX_FILE_SIZE_BYTES },
      fileFilter: (_req, file, callback) => {
        callback(null, ALLOWED_MIME_TYPES.has(file.mimetype));
      },
    }),
  )
  uploadImage(@Req() req: Request, @UploadedFile() file?: Express.Multer.File): { url: string } {
    const user = resolveAuthedUser(req, this.tokenService);
    if (!user) {
      throw new UnauthorizedException("Giriş yapmanız gerekiyor");
    }
    if (!file) {
      throw new BadRequestException("Desteklenmeyen dosya türü veya dosya eksik (jpeg/png/webp/gif, maks 5MB)");
    }
    return { url: `/uploads/${resolveUploadFolder(req)}/${file.filename}` };
  }
}
