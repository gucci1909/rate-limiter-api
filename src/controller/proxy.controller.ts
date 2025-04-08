import { Request, Response } from "express";
import { redis } from "../config/redisConnection.js";
import { AppModel, RateLimitResult } from "../types/controllers.js";
import { slidingWindow } from "../rateLimiterStrategy/slidingWindowCounter.js";
import { tokenBucket } from "../rateLimiterStrategy/tokenBucket.js";

const useStrategyBaseApiUrl: any = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const appId = req.params?.app_id;

  if (!appId) {
    return res.status(400).json({ error: "App ID is required" });
  }

  try {
    const appDataRaw = await redis.get(`app:${appId}`);

    if (!appDataRaw) {
      return res.status(404).json({ error: "App not found" });
    }
    const parsedData: AppModel =
      typeof appDataRaw === "string" ? JSON.parse(appDataRaw) : appDataRaw;

    const { baseUrl, rateLimit } = parsedData;

    if (!baseUrl || !rateLimit) {
      return res.status(400).json({ error: "Invalid app configuration" });
    }

    let limiterResult: RateLimitResult;

    if (rateLimit.strategy === "sliding-window") {
      
      limiterResult = await slidingWindow({
        appId,
        strategy: "sliding-window",
        limit: rateLimit.requestCount,
        timeWindow: rateLimit.timeWindow,
      });

    } else if (rateLimit.strategy === "token-bucket") {
      
      limiterResult = await tokenBucket({
        appId,
        strategy: "token-bucket",
        limit: rateLimit.requestCount,
        timeWindow: rateLimit.timeWindow,
        bucketSize: rateLimit.bucketSize || 10,
        refillRate: rateLimit.refillRate || 1,
      });

    } else {
      return res.status(400).json({ error: "Unknown rate limiting strategy" });
    }

    if (!limiterResult.allowed) {
      return res.status(429).json({
        error: "Rate limit exceeded",
        retryAfter: `${limiterResult.retryAfter} seconds`,
      });
    }

    return res.status(200).json({
      message: "API is accessible",
      apiURL: baseUrl,
    });

  } catch (error) {
    console.error("Error resolving base API URL:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export { useStrategyBaseApiUrl };
