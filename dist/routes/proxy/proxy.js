import express from "express";
import { useStrategyBaseApiUrl } from "../../controller/proxy.controller.js";
const proxyRoutes = express.Router();
/**
 * @route GET /apis/:app_id
 * @desc Get app details or forwarded proxied API
 */
proxyRoutes.get("/:app_id", useStrategyBaseApiUrl);
/**
 * @route GET /apis/:app_id/status
 * @desc Get status of app - rate limits, current usage etc.
 */
// proxyRoutes.get("/:app_id/status", getAppStatus);
/**
 * @route GET /apis/:app_id/analytics
 * @desc Get analytics of API usage, from Redis or RabbitMQ logs
 */
// proxyRoutes.get("/:app_id/analytics", getAppAnalytics);
export default proxyRoutes;
