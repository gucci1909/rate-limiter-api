import { getChannel } from "../config/rabbitMq.js";
import { redis } from "../config/redisConnection.js";
import {
  RateLimitResult,
  SlidingWindowInput,
} from "../types/rateLimiterStrategy.js";

const getSlidingWindowKey = (appId: string): string => `slidingWindow:${appId}`;

const getCurrentTimestamp = (): number => Date.now();

const getWindowStart = (now: number, timeWindow: number): number =>
  now - timeWindow * 1000;

const removeOldEntries = async (key: string, windowStart: number): Promise<void> => {
  await redis.zremrangebyscore(key, 0, windowStart);
};

const getRequestCount = async (key: string): Promise<number> => {
  return await redis.zcard(key);
};

const addRequest = async (key: string, now: number, timeWindow: number): Promise<void> => {
  await redis.zadd(key, { score: now, member: `${now}` });
  await redis.expire(key, timeWindow);
};

const queueRateLimitEvent = async (appId: string): Promise<void> => {
  const channel = getChannel();
  await channel.sendToQueue(
    "rate-limit-queue",
    Buffer.from(JSON.stringify({ appId, strategy: "sliding-window" }))
  );
};

const calculateRetryAfter = async (key: string, now: number, timeWindow: number): Promise<number> => {
  const oldest = await redis.zrange(key, 0, 0, { withScores: true });

  if (oldest && oldest.length >= 2) {
    const oldestScore = Number(oldest[1]);
    return (oldestScore + timeWindow * 1000 - now) / 1000;
  }

  return 1;
};

const slidingWindow = async (
  input: SlidingWindowInput
): Promise<RateLimitResult> => {
  const { appId, limit, timeWindow } = input;
  const key = getSlidingWindowKey(appId);
  const now = getCurrentTimestamp();
  const windowStart = getWindowStart(now, timeWindow);

  await removeOldEntries(key, windowStart);
  const requestCount = await getRequestCount(key);

  if (requestCount < limit) {
    await addRequest(key, now, timeWindow);
    return { allowed: true };
  } else {
    await queueRateLimitEvent(appId);
    const retryAfter = await calculateRetryAfter(key, now, timeWindow);
    return {
      allowed: false,
      retryAfter,
    };
  }
};

export { slidingWindow };