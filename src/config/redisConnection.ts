import dotenv from "dotenv";
import { Redis } from '@upstash/redis';

dotenv.config();

// this redis connection is used for token bucket strategy and sliding window strategy to store the rate limit data
// and also used for storing the app data in the register endpoint

if (!process.env.UPSTASH_REDIS_URL || !process.env.UPSTASH_REDIS_TOKEN) {
  throw new Error("Missing Redis configuration in environment variables");
}

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!,
});
