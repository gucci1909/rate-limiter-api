import { v4 as uuidv4 } from "uuid";
import crypto from "crypto";

export function generateApiKeySHA256(): string {
  const uuid = uuidv4();
  const hash = crypto.createHash("sha256").update(uuid).digest("hex");
  return hash.slice(0, 32);
}
