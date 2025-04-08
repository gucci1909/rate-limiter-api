export interface RateLimitConfig {
  strategy: "sliding-window" | "token-bucket";
  requestCount: number;
  timeWindow: number;
  bucketSize?: number;
  refillRate?: number;
}

export interface RegisterPayload {
  baseUrl: string;
  rateLimit: RateLimitConfig;
}

export interface AppModel extends RegisterPayload {
  appId: string;
  createdAt: string;
}

export interface RateLimitResult {
  allowed: boolean;
  retryAfter?: number;
}

export interface TokenBucket {
  tokens: number;
  lastRefill: number;
}