import express from "express";
import dotenv from "dotenv";
import { validateRegisterApp } from "../../helper/register/registerValidator.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import { registerApp } from "../../controller/register.controller.js";

dotenv.config();

const registerRoutes = express.Router();

/**
 * @route POST /apis/register
 * @desc Register an external API ("app") to be proxied with rate-limiting config
 * @payload {
 *   baseUrl: string,
 *   rateLimit: {
 *     strategy: string,
 *     requestCount: number,
 *     timeWindow: number,
 *     ...additionalParams
 *   },
 *  expiryHours: number
 * }
 * @returns { appId: string }
 */
registerRoutes.post(
  "/register",
  validateRegisterApp,
  validateRequest,
  registerApp
);

export default registerRoutes;
