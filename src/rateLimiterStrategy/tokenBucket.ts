import { getChannel } from "../config/rabbitMq.js";
import { redis } from "../config/redisConnection.js";
import { TokenBucket } from "../types/controllers.js";
import {
  RateLimitResult,
  TokenBucketInput,
} from "../types/rateLimiterStrategy.js";

const fetchBucketFromRedis = async (
  key: string,
  bucketSize: number,
  now: number
): Promise<TokenBucket> => {
  const raw = await redis.get(key);
  if (raw) {
    return typeof raw === "string" ? JSON.parse(raw) : (raw as any);
  }
  return {
    tokens: bucketSize,
    lastRefill: now,
  };
};

const refillBucket = (
  bucket: TokenBucket,
  refillRate: number,
  bucketSize: number,
  now: number
): TokenBucket => {
  const elapsed = (now - bucket.lastRefill) / 1000;
  const refillTokens = Math.floor(elapsed * refillRate);
  bucket.tokens = Math.min(bucketSize, bucket.tokens + refillTokens);
  bucket.lastRefill = now;
  return bucket;
};

const queueRateLimitEvent = async (appId: string) => {
  const channel = getChannel();
  await channel.sendToQueue(
    "rate-limit-queue",
    Buffer.from(JSON.stringify({ appId, strategy: "token-bucket" }))
  );
};

const tokenBucket = async (
  input: TokenBucketInput
): Promise<RateLimitResult> => {
  const { appId, bucketSize, refillRate } = input;
  const key = `tokenBucket:${appId}`;
  const now = Date.now();

  let bucket = await fetchBucketFromRedis(key, bucketSize, now);
  bucket = refillBucket(bucket, refillRate, bucketSize, now);

  if (bucket.tokens > 0) {
    bucket.tokens -= 1;
    await redis.set(key, JSON.stringify(bucket));
    return { allowed: true };
  } else {
    await queueRateLimitEvent(appId);
    return { allowed: false, retryAfter:  1 / refillRate };
  }
};

export { tokenBucket };
