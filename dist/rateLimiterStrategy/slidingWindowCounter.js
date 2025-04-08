import { getChannel } from "../config/rabbitMq.js";
import { redis } from "../config/redisConnection.js";
export const tokenBucket = async (input) => {
    const { appId, bucketSize, refillRate } = input;
    const key = `tokenBucket:${appId}`;
    const now = Date.now();
    const bucketDataRaw = await redis.get(key);
    let bucket;
    if (bucketDataRaw) {
        bucket = typeof bucketDataRaw === "string" ? JSON.parse(bucketDataRaw) : bucketDataRaw;
    }
    else {
        bucket = {
            tokens: bucketSize,
            lastRefill: now,
        };
    }
    const elapsed = (now - bucket.lastRefill) / 1000;
    const refillTokens = Math.floor(elapsed * refillRate);
    bucket.tokens = Math.min(bucketSize, bucket.tokens + refillTokens);
    bucket.lastRefill = now;
    console.log({ b: bucket.tokens });
    if (bucket.tokens > 0) {
        bucket.tokens -= 1;
        await redis.set(key, JSON.stringify(bucket));
        return { allowed: true };
    }
    else {
        const channel = getChannel();
        await channel.sendToQueue("rate-limit-queue", Buffer.from(JSON.stringify({ appId, strategy: "token-bucket" })));
        const retryAfter = 1 / refillRate;
        return {
            allowed: false,
            retryAfter,
        };
    }
};
export const slidingWindow = async (input) => {
    const { appId, limit, timeWindow } = input;
    const key = `slidingWindow:${appId}`;
    const now = Date.now();
    const windowStart = now - timeWindow * 1000;
    // Remove old entries outside the time window
    await redis.zremrangebyscore(key, 0, windowStart);
    const requestCount = await redis.zcard(key);
    if (requestCount < limit) {
        // Add current request timestamp to the sorted set
        await redis.zadd(key, {
            score: now,
            member: `${now}`,
        });
        await redis.expire(key, timeWindow);
        return { allowed: true };
    }
    else {
        // Send message to RabbitMQ if rate limited
        const channel = getChannel();
        await channel.sendToQueue("rate-limit-queue", Buffer.from(JSON.stringify({ appId, strategy: "sliding-window" })));
        // Get the oldest timestamp to estimate retryAfter
        const oldest = await redis.zrange(key, 0, 0, { withScores: true });
        let retryAfter = 1;
        if (oldest && oldest.length >= 2) {
            const oldestScore = Number(oldest[1]);
            retryAfter = (oldestScore + timeWindow * 1000 - now) / 1000;
        }
        return {
            allowed: false,
            retryAfter,
        };
    }
};
