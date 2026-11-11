import "server-only";
import { createHash } from "node:crypto";
import { getAdminClient } from "@/lib/supabase/server";

type Db = NonNullable<ReturnType<typeof getAdminClient>>;
export type RateLimitDeps = { db?: Db | null };

const TABLE = "rate_limits";
let warned = false;
function warnOnce(msg: string) {
  if (warned) return;
  warned = true;
  console.warn(`[rateLimit] ${msg}`);
}

/** SHA-256 of IP + AUTH_SECRET. Raw IPs are never stored. */
export function hashKey(ip: string): string {
  return createHash("sha256")
    .update(`${ip}|${process.env.AUTH_SECRET ?? ""}`)
    .digest("hex");
}

/** Best-effort client IP from proxy headers. */
export function clientIp(h: { get(name: string): string | null }): string {
  const fwd = h.get("x-forwarded-for")?.split(",")[0]?.trim();
  return fwd || h.get("x-real-ip")?.trim() || "unknown";
}

function resolve(deps?: RateLimitDeps): Db | null {
  return deps && "db" in deps ? (deps.db ?? null) : getAdminClient();
}

function unavailable(err: { code?: string; message?: string }): void {
  warnOnce(
    `rate_limits unavailable (${err.code ?? "unknown"}). Run supabase/migrations/0002_rate_limits.sql. Allowing the attempt.`,
  );
}

/** Hits for (bucket, key) inside the window; null if the store is unavailable. */
export async function countHits(
  bucket: string,
  key: string,
  windowSec: number,
  deps?: RateLimitDeps,
): Promise<number | null> {
  const db = resolve(deps);
  if (!db) {
    warnOnce("Supabase env vars missing. Rate limiting disabled.");
    return null;
  }
  try {
    const since = new Date(Date.now() - windowSec * 1000).toISOString();
    const { count, error } = await db
      .from(TABLE)
      .select("id", { count: "exact", head: true })
      .eq("bucket", bucket)
      .eq("key", key)
      .gte("created_at", since);
    if (error) {
      unavailable(error);
      return null;
    }
    return count ?? 0;
  } catch (e) {
    unavailable({ message: String(e) });
    return null;
  }
}

/** Records one hit; occasionally prunes rows older than a day. */
export async function recordHit(
  bucket: string,
  key: string,
  deps?: RateLimitDeps,
): Promise<void> {
  const db = resolve(deps);
  if (!db) return;
  try {
    const { error } = await db.from(TABLE).insert({ bucket, key });
    if (error) {
      unavailable(error);
      return;
    }
    if (Math.random() < 0.02) {
      const cutoff = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
      await db.from(TABLE).delete().lt("created_at", cutoff);
    }
  } catch (e) {
    unavailable({ message: String(e) });
  }
}

/** True when (bucket, key) already has >= limit hits inside the window. Does not record. */
export async function isLimited(
  bucket: string,
  key: string,
  limit: number,
  windowSec: number,
  deps?: RateLimitDeps,
): Promise<boolean> {
  const n = await countHits(bucket, key, windowSec, deps);
  return n !== null && n >= limit;
}

/**
 * Counts hits in the window; if under the limit, records this one and allows it.
 * Fails open (allowed) when the table is missing.
 */
export async function checkAndRecord(
  bucket: string,
  key: string,
  limit: number,
  windowSec: number,
  deps?: RateLimitDeps,
): Promise<{ allowed: boolean; remaining: number }> {
  const n = await countHits(bucket, key, windowSec, deps);
  if (n === null) return { allowed: true, remaining: limit };
  if (n >= limit) return { allowed: false, remaining: 0 };
  await recordHit(bucket, key, deps);
  return { allowed: true, remaining: limit - n - 1 };
}
