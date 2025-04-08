import { Request, Response, NextFunction } from "express";
import { CustomError } from "../types/middleware";

const errorHandler = (
  err: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  res.status(statusCode).json({ success: false, message });

  import("../config/logger.js").then(({ default: logger }) => {
    logger.error(`${req.method} ${req.url} - ${statusCode}: ${message}`);
  });
};

export default errorHandler;
