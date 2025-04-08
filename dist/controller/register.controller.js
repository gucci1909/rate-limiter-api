import { generateApiKeySHA256 } from "../helper/register/generateApiKey.js";
import { redis } from "../config/redisConnection.js";
const registerApp = async (req, res) => {
    try {
        const { baseUrl, rateLimit } = req.body;
        if (!baseUrl ||
            !rateLimit?.strategy ||
            !rateLimit.requestCount ||
            !rateLimit.timeWindow) {
            res.status(400).json({
                error: "Missing required fields: baseUrl, rateLimit.strategy, requestCount, timeWindow",
            });
            return;
        }
        const appId = generateApiKeySHA256();
        const newApp = {
            appId,
            baseUrl,
            rateLimit,
            createdAt: new Date().toISOString(),
        };
        await redis.set(`app:${appId}`, JSON.stringify(newApp));
        res.status(201).json({
            message: "App registered successfully",
            appId,
        });
    }
    catch (error) {
        console.error("Error registering app:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};
export { registerApp };
