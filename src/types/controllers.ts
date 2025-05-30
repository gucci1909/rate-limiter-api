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
  expiryHours?: number;
}

export interface AppModel extends RegisterPayload {
  appId: string;
  createdAt: string;
}

export interface TokenBucket {
  tokens: number;
  lastRefill: number;
}