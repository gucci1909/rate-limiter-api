import { body } from "express-validator";

const validateRegisterApp = [
  body("baseUrl")
    .notEmpty()
    .withMessage("Base URL is required")
    .isURL()
    .withMessage("Base URL must be a valid URL"),

  body("rateLimit")
    .notEmpty()
    .withMessage("Rate limit configuration is required"),

  body("rateLimit.strategy")
    .notEmpty()
    .withMessage("Rate limit strategy is required")
    .isIn(["token-bucket", "sliding-window"])
    .withMessage("Strategy must be 'token-bucket' or 'sliding-window'"),

  body("rateLimit.requestCount")
    .notEmpty()
    .withMessage("Request count is required")
    .isInt({ gt: 0 })
    .withMessage("Request count must be a positive integer"),

  body("rateLimit.timeWindow")
    .notEmpty()
    .withMessage("Time window is required")
    .isInt({ gt: 0 })
    .withMessage("Time window must be a positive integer"),

  body("rateLimit.bucketSize")
    .if((value, { req }) => req.body.rateLimit?.strategy === "token-bucket")
    .notEmpty()
    .withMessage("Bucket size is required for token-bucket strategy")
    .isInt({ gt: 0 })
    .withMessage("Bucket size must be a positive integer"),

  body("rateLimit.refillRate")
    .if((value, { req }) => req.body.rateLimit?.strategy === "token-bucket")
    .notEmpty()
    .withMessage("Refill rate is required for token-bucket strategy")
    .isInt({ gt: 0 })
    .withMessage("Refill rate must be a positive integer"),
];

export { validateRegisterApp };
