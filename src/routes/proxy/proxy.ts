import express from "express";
import dotenv from "dotenv";

dotenv.config();

const proxyRoutes = express.Router();

proxyRoutes.use();

/**
 * @route GET /apis/:app_id
 * @desc View likes to a specific post
 */
proxyRoutes.get("/:app_id");

/**
 * @route GET /api/likes/:post_id
 * @desc Add a like to a specific post
 */
proxyRoutes.get("/:app_id/status");

/**
 * @route get /api/likes/:post_id
 * @desc Remove a like from a specific post
 */
proxyRoutes.get("/:app_id/analytics");

export default proxyRoutes;
