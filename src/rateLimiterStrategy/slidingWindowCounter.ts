import { getChannel } from "../config/rabbitMq.js";
import { redis } from "../config/redisConnection.js";
import {
  RateLimitResult,
  SlidingWindowInput,
} from "../types/rateLimiterStrategy.js";

const addRequest = async (
  key: string,
  now: number,
  timeWindow: number
): Promise<void> => {
  await redis.zadd(key, { score: now, member: `${now}` });
  await redis.expire(key, timeWindow);
};

const queueRateLimitEvent = async (
  request: SlidingWindowInput
): Promise<void> => {
  const channel = getChannel();

  await channel.sendToQueue(
    "rate-limit-queue",
    Buffer.from(
      JSON.stringify({
        appId: request.appId,
        requestId: request.requestId,
        payload: request,
        strategy: "sliding-window",
      })
    )
  );
};

const calculateRetryAfter = async (
  key: string,
  now: number,
  timeWindow: number
): Promise<number> => {
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
  const key = `slidingWindow:${appId}`;
  const now = Date.now();
  const windowStart = now - timeWindow * 1000;

  await redis.zremrangebyscore(key, 0, windowStart);
  const requestCount = await redis.zcard(key);

  if (requestCount < limit) {
    await addRequest(key, now, timeWindow);
    return { allowed: true };
  } else {
    await queueRateLimitEvent(input);
    const retryAfter = await calculateRetryAfter(key, now, timeWindow);
    return {
      allowed: false,
      statusCode: 202,
      message: "Request queued due to rate limiting.",
      retryAfter,
    };
  }
};

export { slidingWindow, queueRateLimitEvent };
