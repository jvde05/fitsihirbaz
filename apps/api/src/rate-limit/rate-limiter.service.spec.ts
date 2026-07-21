const incrMock = jest.fn();
const expireMock = jest.fn();
const quitMock = jest.fn();

jest.mock("ioredis", () =>
  jest.fn().mockImplementation(() => ({
    incr: incrMock,
    expire: expireMock,
    quit: quitMock,
  })),
);

import { ConfigService } from "@nestjs/config";
import { RateLimiterService } from "./rate-limiter.service";

describe("RateLimiterService", () => {
  let service: RateLimiterService;
  const config = { get: jest.fn().mockReturnValue("redis://localhost:6379") };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new RateLimiterService(config as unknown as ConfigService<never, true>);
  });

  it("ilk istekte sayaç 1 olur, TTL set edilir ve izin verilir", async () => {
    incrMock.mockResolvedValue(1);

    const allowed = await service.isAllowed("k", 5, 60);

    expect(allowed).toBe(true);
    expect(expireMock).toHaveBeenCalledWith("k", 60);
  });

  it("limit altındayken sonraki isteklerde TTL tekrar set edilmez", async () => {
    incrMock.mockResolvedValue(3);

    const allowed = await service.isAllowed("k", 5, 60);

    expect(allowed).toBe(true);
    expect(expireMock).not.toHaveBeenCalled();
  });

  it("limit tam doluyken izin verir", async () => {
    incrMock.mockResolvedValue(5);

    const allowed = await service.isAllowed("k", 5, 60);

    expect(allowed).toBe(true);
  });

  it("limit aşılınca izin vermez", async () => {
    incrMock.mockResolvedValue(6);

    const allowed = await service.isAllowed("k", 5, 60);

    expect(allowed).toBe(false);
  });

  it("onModuleDestroy redis bağlantısını kapatır", async () => {
    await service.onModuleDestroy();
    expect(quitMock).toHaveBeenCalledTimes(1);
  });
});
