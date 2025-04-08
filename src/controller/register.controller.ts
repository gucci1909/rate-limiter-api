import { Request, Response } from "express";
import { generateApiKeySHA256 } from "../helper/register/generateApiKey.js";
import { redis } from "../config/redisConnection.js";
import { AppModel, RegisterPayload } from "../types/controllers.js";

const registerApp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { baseUrl, rateLimit, expiryHours } = req.body as RegisterPayload;

    if (
      !baseUrl ||
      !rateLimit?.strategy ||
      !rateLimit.requestCount ||
      !rateLimit.timeWindow
    ) {
      res.status(400).json({
        error:
          "Missing required fields: baseUrl, rateLimit.strategy, requestCount, timeWindow",
      });
      return;
    }

    const appId = generateApiKeySHA256();

    const newApp: AppModel = {
      appId,
      baseUrl,
      rateLimit,
      createdAt: new Date().toISOString(),
    };

    const expirySeconds = Math.min(Math.max(expiryHours as number, 1), 720) * 3600;

    await redis.set(`app:${appId}`, JSON.stringify(newApp), {
      ex: expirySeconds,
    });

    res.status(201).json({
      message: "App registered successfully",
      appId,
    });
  } catch (error) {
    console.error("Error registering app:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export { registerApp };
