import type { Request } from "express";
import { UnauthorizedException, BadRequestException } from "@nestjs/common";
import { UploadsController } from "./uploads.controller";
import { TokenService } from "../auth/token.service";
import type { ConfigService } from "@nestjs/config";
import type { Env } from "../config/env.validation";

function buildTokenService(): TokenService {
  const config = {
    getOrThrow: (key: string) => {
      if (key === "JWT_ACCESS_SECRET") return "test-access-secret";
      if (key === "JWT_ACCESS_EXPIRES_IN") return "15m";
      throw new Error(`unexpected config key: ${key}`);
    },
  };
  return new TokenService(config as unknown as ConfigService<Env, true>);
}

function buildRequest(overrides: Partial<Request> = {}): Request {
  return { headers: {}, cookies: {}, query: {}, ...overrides } as unknown as Request;
}

function buildFile(overrides: Partial<Express.Multer.File> = {}): Express.Multer.File {
  return { filename: "abc123.png", ...overrides } as Express.Multer.File;
}

describe("UploadsController", () => {
  let tokenService: TokenService;
  let controller: UploadsController;

  beforeEach(() => {
    tokenService = buildTokenService();
    controller = new UploadsController(tokenService);
  });

  it("Authorization header'ı olmayan istekte UnauthorizedException fırlatır", () => {
    const req = buildRequest();
    expect(() => controller.uploadImage(req, buildFile())).toThrow(UnauthorizedException);
  });

  it("geçersiz/bozuk bir access token ile UnauthorizedException fırlatır", () => {
    const req = buildRequest({ headers: { authorization: "Bearer not-a-real-jwt" } });
    expect(() => controller.uploadImage(req, buildFile())).toThrow(UnauthorizedException);
  });

  it("dosya eksikse (fileFilter reddetmişse) BadRequestException fırlatır", () => {
    const accessToken = tokenService.signAccessToken("user-1", "CLIENT");
    const req = buildRequest({ headers: { authorization: `Bearer ${accessToken}` } });
    expect(() => controller.uploadImage(req, undefined)).toThrow(BadRequestException);
  });

  it("geçerli token + dosyayla varsayılan (kind belirtilmemiş) uploads/posts altında URL döner", () => {
    const accessToken = tokenService.signAccessToken("user-1", "CLIENT");
    const req = buildRequest({ headers: { authorization: `Bearer ${accessToken}` }, query: {} });
    const result = controller.uploadImage(req, buildFile({ filename: "x.png" }));
    expect(result).toEqual({ url: "/uploads/posts/x.png" });
  });

  it("kind=avatar için uploads/avatars altında URL döner", () => {
    const accessToken = tokenService.signAccessToken("user-1", "CLIENT");
    const req = buildRequest({ headers: { authorization: `Bearer ${accessToken}` }, query: { kind: "avatar" } });
    const result = controller.uploadImage(req, buildFile({ filename: "x.png" }));
    expect(result).toEqual({ url: "/uploads/avatars/x.png" });
  });

  it("kind=progress için uploads/progress altında URL döner", () => {
    const accessToken = tokenService.signAccessToken("user-1", "CLIENT");
    const req = buildRequest({ headers: { authorization: `Bearer ${accessToken}` }, query: { kind: "progress" } });
    const result = controller.uploadImage(req, buildFile({ filename: "x.png" }));
    expect(result).toEqual({ url: "/uploads/progress/x.png" });
  });

  it("kind=certification için uploads/certifications altında URL döner", () => {
    const accessToken = tokenService.signAccessToken("user-1", "DIETITIAN");
    const req = buildRequest({ headers: { authorization: `Bearer ${accessToken}` }, query: { kind: "certification" } });
    const result = controller.uploadImage(req, buildFile({ filename: "x.png" }));
    expect(result).toEqual({ url: "/uploads/certifications/x.png" });
  });

  it("tanınmayan bir kind için varsayılan olarak uploads/posts kullanır", () => {
    const accessToken = tokenService.signAccessToken("user-1", "CLIENT");
    const req = buildRequest({ headers: { authorization: `Bearer ${accessToken}` }, query: { kind: "something-else" } });
    const result = controller.uploadImage(req, buildFile({ filename: "x.png" }));
    expect(result).toEqual({ url: "/uploads/posts/x.png" });
  });
});
