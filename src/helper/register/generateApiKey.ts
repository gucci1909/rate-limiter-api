import { v4 as uuidv4 } from "uuid";
import crypto from "crypto";

/* SHA-256 gives a consistent 64-character hex string. Slicing to 32 characters creates a clean, fixed-length token (good for API keys or headers).*/

export function generateApiKeySHA256(): string {
  const uuid = uuidv4();
  const hash = crypto.createHash("sha256").update(uuid).digest("hex");
  return hash.slice(0, 32);
}
