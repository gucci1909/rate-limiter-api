export interface BaseRateLimitInput {
  appId: string;
  strategy: string;
  limit: number;
  timeWindow: number;
}

export interface TokenBucketInput extends BaseRateLimitInput {
  strategy: "token-bucket";
  bucketSize: number;
  refillRate: number;
}

export interface SlidingWindowInput extends BaseRateLimitInput {
  strategy: "sliding-window";
}

export interface RateLimitResult {
  allowed: boolean;
  retryAfter?: number;
}
