import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import IORedis from "ioredis";
import type { Env } from "../config/env.validation";

@Injectable()
export class RateLimiterService implements OnModuleDestroy {
  private readonly redis: IORedis;

  constructor(config: ConfigService<Env, true>) {
    this.redis = new IORedis(config.get("REDIS_URL", { infer: true }), { maxRetriesPerRequest: null });
  }

  // Sabit pencereli (fixed-window) sayaç: key altında arttırır, ilk arttırmada TTL=windowSec
  // set edilir (sonraki arttırmalarda TTL sıfırlanmaz — pencere kayması engellenir).
  async isAllowed(key: string, max: number, windowSec: number): Promise<boolean> {
    const count = await this.redis.incr(key);
    if (count === 1) {
      await this.redis.expire(key, windowSec);
    }
    return count <= max;
  }

  async onModuleDestroy(): Promise<void> {
    await this.redis.quit();
  }
}
