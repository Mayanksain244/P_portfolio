import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import { beforeEach, describe, expect, it, vi } from "vitest";

const SECRET = "test-secret-test-secret-test-secret-123456";
process.env.AUTH_SECRET = SECRET;

// ---- next/headers + next/navigation mocks (for requireAdmin) ----
const cookieStore = { value: undefined as string | undefined };
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) =>
      name === "admin_session" && cookieStore.value ? { value: cookieStore.value } : undefined,
    set: vi.fn(),
  }),
  headers: async () => new Headers(),
}));
vi.mock("next/navigation", () => ({
  redirect: (to: string) => {
    throw new Error(`NEXT_REDIRECT:${to}`);
  },
}));

import { verifyCredentials } from "@/lib/auth/credentials";
import { adminRedirect, safeNext } from "@/lib/auth/routing";
import { requireAdmin } from "@/lib/auth/session";
import { signSessionToken, verifySessionToken } from "@/lib/auth/token";
import { addImageSchema, albumSchema, imageUpdateSchema, loginSchema } from "@/lib/admin/schemas";
import { checkAndRecord, hashKey, isLimited } from "@/lib/rateLimit";
import { slugify } from "@/lib/slug";

beforeEach(() => {
  process.env.AUTH_SECRET = SECRET;
  cookieStore.value = undefined;
});

describe("session token", () => {
  it("signs then verifies", async () => {
    expect(await verifySessionToken(await signSessionToken())).toBe(true);
  });
  it("rejects a tampered token", async () => {
    const t = await signSessionToken();
    const [h, p, s] = t.split(".");
    const flipped = s.slice(0, -2) + (s.endsWith("AA") ? "BB" : "AA");
    expect(await verifySessionToken(`${h}.${p}.${flipped}`)).toBe(false);
    expect(await verifySessionToken(`${h}.${p}x.${s}`)).toBe(false);
  });
  it("rejects an expired token", async () => {
    const key = new TextEncoder().encode(SECRET);
    const old = await new SignJWT({ sub: "admin" })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt(Math.floor(Date.now() / 1000) - 7200)
      .setExpirationTime(Math.floor(Date.now() / 1000) - 3600)
      .sign(key);
    expect(await verifySessionToken(old)).toBe(false);
  });
  it("rejects tokens signed with another secret, another subject, or empty input", async () => {
    const other = await new SignJWT({ sub: "admin" })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("1h")
      .sign(new TextEncoder().encode("a-completely-different-secret-value-xx"));
    expect(await verifySessionToken(other)).toBe(false);
    const notAdmin = await new SignJWT({ sub: "someone" })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("1h")
      .sign(new TextEncoder().encode(SECRET));
    expect(await verifySessionToken(notAdmin)).toBe(false);
    expect(await verifySessionToken(undefined)).toBe(false);
    expect(await verifySessionToken("")).toBe(false);
  });
});

describe("requireAdmin", () => {
  it("redirects to login when there is no cookie", async () => {
    await expect(requireAdmin()).rejects.toThrow("NEXT_REDIRECT:/admin/login");
  });
  it("redirects on a garbage cookie", async () => {
    cookieStore.value = "not.a.jwt";
    await expect(requireAdmin()).rejects.toThrow("NEXT_REDIRECT:/admin/login");
  });
  it("passes with a valid session cookie", async () => {
    cookieStore.value = await signSessionToken();
    await expect(requireAdmin()).resolves.toBeUndefined();
  });
});

describe("admin mutations require a session", () => {
  it("rejects before touching the database", async () => {
    const { deleteAlbum } = await import("@/app/admin/actions/albums");
    const { deleteImages } = await import("@/app/admin/actions/images");
    const { deleteMessage } = await import("@/app/admin/actions/messages");
    const id = "11111111-1111-4111-8111-111111111111";
    await expect(deleteAlbum(id, "x")).rejects.toThrow("NEXT_REDIRECT");
    await expect(deleteImages([id])).rejects.toThrow("NEXT_REDIRECT");
    await expect(deleteMessage(id)).rejects.toThrow("NEXT_REDIRECT");
  });
});

describe("credentials", () => {
  it("accepts the right password and rejects the wrong one", async () => {
    process.env.ADMIN_USERNAME = "admin";
    process.env.ADMIN_PASSWORD_HASH = await bcrypt.hash("correct horse", 4);
    expect(await verifyCredentials("admin", "correct horse")).toBe(true);
    expect(await verifyCredentials("admin", "wrong")).toBe(false);
    expect(await verifyCredentials("root", "correct horse")).toBe(false);
  });
  it("fails closed when no hash is configured", async () => {
    process.env.ADMIN_PASSWORD_HASH = "";
    expect(await verifyCredentials("admin", "anything")).toBe(false);
  });
});

describe("middleware redirect logic", () => {
  it("sends anonymous users to login with ?next", () => {
    expect(adminRedirect("/admin", "", false)).toBe("/admin/login?next=%2Fadmin");
    expect(adminRedirect("/admin/albums", "?x=1", false)).toBe(
      "/admin/login?next=%2Fadmin%2Falbums%3Fx%3D1",
    );
  });
  it("lets anonymous users reach the login page", () => {
    expect(adminRedirect("/admin/login", "", false)).toBeNull();
  });
  it("sends logged-in users away from login and lets them through elsewhere", () => {
    expect(adminRedirect("/admin/login", "", true)).toBe("/admin");
    expect(adminRedirect("/admin/albums", "", true)).toBeNull();
  });
  it("only accepts same-site /admin targets after login", () => {
    expect(safeNext("/admin/albums/1")).toBe("/admin/albums/1");
    expect(safeNext("https://evil.example")).toBe("/admin");
    expect(safeNext("//evil.example")).toBe("/admin");
    expect(safeNext("/adminx")).toBe("/admin");
    expect(safeNext("/admin/login")).toBe("/admin");
    expect(safeNext(null)).toBe("/admin");
  });
});

describe("slugify", () => {
  it("makes URL-safe slugs", () => {
    expect(slugify("Bridge at Dugadda, 2025!")).toBe("bridge-at-dugadda-2025");
    expect(slugify("  Café & Roads  ")).toBe("cafe-and-roads");
    expect(slugify("---a---b---")).toBe("a-b");
  });
  it("returns empty for non-latin only input", () => {
    expect(slugify("पुल का उद्घाटन")).toBe("");
  });
  it("caps the length", () => {
    expect(slugify("a".repeat(200)).length).toBeLessThanOrEqual(80);
  });
});

describe("album schema", () => {
  const base = { title_en: "Bridge", slug: "bridge-1", category: "bridges", published: false };
  it("accepts a minimal album and normalises empty optionals to null", () => {
    const r = albumSchema.parse({ ...base, title_hi: "  ", event_date: "", location_en: "" });
    expect(r.title_hi).toBeNull();
    expect(r.event_date).toBeNull();
    expect(r.location_en).toBeNull();
  });
  it("requires an English title", () => {
    expect(albumSchema.safeParse({ ...base, title_en: "   " }).success).toBe(false);
  });
  it("enforces the slug pattern", () => {
    for (const slug of ["Has Space", "UPPER", "under_score", "", "a/b", "é"]) {
      expect(albumSchema.safeParse({ ...base, slug }).success).toBe(false);
    }
    expect(albumSchema.safeParse({ ...base, slug: "ok-slug-9" }).success).toBe(true);
  });
  it("rejects unknown categories and bad dates", () => {
    expect(albumSchema.safeParse({ ...base, category: "nope" }).success).toBe(false);
    expect(albumSchema.safeParse({ ...base, event_date: "12/03/2024" }).success).toBe(false);
    expect(albumSchema.safeParse({ ...base, event_date: "2024-03-12" }).success).toBe(true);
  });
});

describe("image schemas", () => {
  const id = "11111111-1111-4111-8111-111111111111";
  it("update schema lowercases, trims and dedupes tags", () => {
    const r = imageUpdateSchema.parse({ id, tags: [" Bridge ", "bridge", "ROAD", ""] });
    expect(r.tags).toEqual(["bridge", "road"]);
  });
  it("update schema treats empty captions as null and leaves absent fields undefined", () => {
    const r = imageUpdateSchema.parse({ id, caption_en: "  " });
    expect(r.caption_en).toBeNull();
    expect(r.caption_hi).toBeUndefined();
  });
  it("update schema rejects bad ids, long tags and extra keys", () => {
    expect(imageUpdateSchema.safeParse({ id: "x" }).success).toBe(false);
    expect(imageUpdateSchema.safeParse({ id, tags: ["a".repeat(41)] }).success).toBe(false);
    expect(imageUpdateSchema.safeParse({ id, album_id: id }).success).toBe(false);
  });
  it("addImage schema only accepts album-scoped storage paths", () => {
    const ok = {
      albumId: id,
      path: `albums/${id}/${id}.webp`,
      width: 100,
      height: 80,
      blur: "data:image/webp;base64,AAAA",
    };
    expect(addImageSchema.safeParse(ok).success).toBe(true);
    expect(addImageSchema.safeParse({ ...ok, path: "../../etc/passwd" }).success).toBe(false);
    expect(addImageSchema.safeParse({ ...ok, width: 0 }).success).toBe(false);
  });
  it("login schema requires both fields", () => {
    expect(loginSchema.safeParse({ username: "a", password: "" }).success).toBe(false);
    expect(loginSchema.safeParse({ username: "a", password: "b" }).success).toBe(true);
  });
});

// ---- rateLimit with a mocked Supabase client ----
function fakeDb(opts: { count?: number; error?: { code: string; message: string } | null }) {
  const inserts: unknown[] = [];
  const chain: Record<string, unknown> = {};
  const result = { count: opts.count ?? 0, error: opts.error ?? null };
  for (const m of ["select", "eq", "gte", "lt"]) chain[m] = () => chain;
  chain.then = (res: (v: unknown) => unknown) => Promise.resolve(result).then(res);
  const db = {
    from: () => ({
      select: () => chain,
      insert: (row: unknown) => {
        inserts.push(row);
        return Promise.resolve({ error: opts.error ?? null });
      },
      delete: () => chain,
    }),
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return { db: db as any, inserts };
}

describe("rateLimit", () => {
  it("hashes keys with IP + secret and never exposes the IP", () => {
    const a = hashKey("1.2.3.4");
    expect(a).toMatch(/^[0-9a-f]{64}$/);
    expect(a).not.toContain("1.2.3.4");
    process.env.AUTH_SECRET = "another-secret-another-secret-xxxxx";
    expect(hashKey("1.2.3.4")).not.toBe(a);
  });
  it("allows and records while under the limit", async () => {
    const { db, inserts } = fakeDb({ count: 2 });
    const r = await checkAndRecord("login", "k", 5, 900, { db });
    expect(r).toEqual({ allowed: true, remaining: 2 });
    expect(inserts).toEqual([{ bucket: "login", key: "k" }]);
  });
  it("blocks at the limit without recording", async () => {
    const { db, inserts } = fakeDb({ count: 5 });
    expect((await checkAndRecord("login", "k", 5, 900, { db })).allowed).toBe(false);
    expect(inserts).toHaveLength(0);
    expect(await isLimited("login", "k", 5, 900, { db })).toBe(true);
  });
  it("fails open when the table is missing", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { db } = fakeDb({ error: { code: "42P01", message: "relation does not exist" } });
    expect((await checkAndRecord("login", "k", 5, 900, { db })).allowed).toBe(true);
    expect(await isLimited("login", "k", 5, 900, { db })).toBe(false);
    warn.mockRestore();
  });
  it("fails open when there is no client", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect((await checkAndRecord("login", "k", 5, 900, { db: null })).allowed).toBe(true);
    warn.mockRestore();
  });
});
