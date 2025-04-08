import { Request, Response } from "express";
import { redis } from "../config/redisConnection.js";
import { AppModel } from "../types/controllers.js";
import { slidingWindow } from "../rateLimiterStrategy/slidingWindowCounter.js";
import { tokenBucket } from "../rateLimiterStrategy/tokenBucket.js";
import { RateLimitResult } from "../types/rateLimiterStrategy.js";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";

const useStrategyBaseApiUrl: any = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const appId = req.params?.app_id;
  const requestId = uuidv4();

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
        requestId,
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

    if (!limiterResult.allowed && limiterResult.statusCode != 202) {
      return res.status(429).json({
        error: "Rate limit exceeded",
        retryAfter: `${limiterResult.retryAfter} seconds`,
      });
    }

    if (limiterResult.statusCode === 202) {
      return res.status(202).json({
        message: "Request queued for processing",
        requestId,
        retryAfter: `${limiterResult.retryAfter} seconds`,
      });
    }

    try {
      const response = await axios.get(baseUrl);

      // Send the exact response data from axios call
      return res.status(200).json(response.data);
    } catch (error) {
      console.error("Error fetching external API:", error);

      return res.status(500).json({
        message: "Failed to fetch API data",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  } catch (error) {
    console.error("Error resolving base API URL:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export { useStrategyBaseApiUrl };
