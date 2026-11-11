// Admin smoke test over HTTP (cookie jar). Dev server must be running on :3000.
// Run: node --env-file=.env.local scripts/smoke-admin.mjs
// Reads the dev password from .admin-dev-password.txt (never printed).
// Login is driven through the progressive-enhancement form POST (React serialises
// the server action's hidden fields into the form), so no JS is needed.
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";

const site = process.env.SMOKE_SITE ?? "http://localhost:3000";
let failed = 0;
const check = (name, ok, extra = "") => {
  if (!ok) failed++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${extra ? ` (${extra})` : ""}`);
};

let password;
try {
  password = readFileSync(new URL("../.admin-dev-password.txt", import.meta.url), "utf8").trim();
} catch {
  console.log("env: .admin-dev-password.txt not found");
  process.exit(2);
}
const username = process.env.ADMIN_USERNAME ?? "admin";

const jar = new Map();
function remember(res) {
  for (const c of res.headers.getSetCookie?.() ?? []) {
    const [pair] = c.split(";");
    const i = pair.indexOf("=");
    const name = pair.slice(0, i);
    const value = pair.slice(i + 1);
    if (!value || /max-age=0/i.test(c)) jar.delete(name);
    else jar.set(name, value);
  }
}
const cookieHeader = () => [...jar].map(([k, v]) => `${k}=${v}`).join("; ");
async function req(path, init = {}) {
  const res = await fetch(site + path, {
    redirect: "manual",
    ...init,
    headers: { ...(init.headers ?? {}), ...(jar.size ? { cookie: cookieHeader() } : {}) },
  });
  remember(res);
  return res;
}

async function login(user, pass) {
  const page = await (await req("/admin/login")).text();
  const form = page.slice(page.indexOf("<form"), page.indexOf("</form>"));
  const fd = new FormData();
  for (const m of form.matchAll(/<input[^>]*type="hidden"[^>]*>/g)) {
    const tag = m[0];
    const name = /name="([^"]*)"/.exec(tag)?.[1];
    const value = /value="([^"]*)"/.exec(tag)?.[1] ?? "";
    if (name) fd.append(name, value.replace(/&quot;/g, '"').replace(/&amp;/g, "&"));
  }
  fd.set("username", user);
  fd.set("password", pass);
  return req("/admin/login", { method: "POST", body: fd, headers: { origin: site } });
}

// 1. Unauthenticated access is redirected.
for (const p of ["/admin", "/admin/albums", "/admin/messages"]) {
  const r = await req(p);
  const loc = r.headers.get("location") ?? "";
  check(`GET ${p} without cookie -> 307 /admin/login`, r.status === 307 && loc.includes("/admin/login"), `${r.status} ${loc}`);
}
check("login page is reachable and noindex", await (async () => {
  const r = await req("/admin/login");
  const t = await r.text();
  return r.status === 200 && /noindex/i.test(t);
})());

// 2. Wrong password fails.
{
  const r = await login(username, "definitely-wrong-password");
  const t = await r.text();
  check("wrong password: no session cookie", !jar.has("admin_session"), `${r.status}`);
  check("wrong password: generic error shown", /Incorrect username or password|Too many attempts/.test(t));
}

// 3. Right password succeeds.
{
  const r = await login(username, password);
  await r.text();
  check("right password: session cookie set", jar.has("admin_session"), `${r.status}`);
  check("right password: redirected into admin", [302, 303, 307].includes(r.status) || r.status === 200);
}

// 4. With the cookie, pages load.
for (const p of ["/admin", "/admin/albums", "/admin/albums/new", "/admin/messages"]) {
  const r = await req(p);
  const t = await r.text();
  check(`GET ${p} with cookie -> 200`, r.status === 200, `${r.status}`);
  check(`GET ${p} has noindex robots`, /name="robots"[^>]*noindex|noindex/i.test(t));
}
{
  const r = await req("/admin/login");
  check("logged-in user on /admin/login -> redirected to /admin", r.status === 307 && (r.headers.get("location") ?? "").endsWith("/admin"));
}
// Tampered cookie is rejected.
{
  const good = jar.get("admin_session");
  jar.set("admin_session", good.slice(0, -3) + (good.endsWith("AAA") ? "BBB" : "AAA"));
  const r = await req("/admin");
  check("tampered cookie -> redirected to login", r.status === 307 && (r.headers.get("location") ?? "").includes("/admin/login"));
  jar.set("admin_session", good);
}

// 5. Storage/DB flow the admin actions rely on, using the same primitives:
//    signed upload URL -> upload with the publishable key -> image rows -> cover -> move -> delete -> clean.
{
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const pub = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const o = { auth: { persistSession: false, autoRefreshToken: false } };
  const admin = createClient(url, secret, o);
  const anon = createClient(url, pub, o);
  const slug = "zz-admin-smoke";
  await admin.from("albums").delete().in("slug", [slug, slug + "-b"]);
  const mk = async (r, g, b) =>
    sharp({ create: { width: 640, height: 480, channels: 3, background: { r, g, b } } }).webp({ quality: 85 }).toBuffer();
  const { data: album, error: ae } = await admin.from("albums").insert({ slug, title_en: "ZZ Admin Smoke", category: "roads", published: true }).select("id").single();
  check("create test album", !ae, ae?.message);
  const { data: album2 } = await admin.from("albums").insert({ slug: slug + "-b", title_en: "ZZ Admin Smoke B", category: "roads", published: false }).select("id").single();
  const ids = [];
  for (let n = 0; n < 2; n++) {
    const path = "albums/" + album.id + "/" + crypto.randomUUID() + ".webp";
    const { data: signed, error: se } = await admin.storage.from("gallery").createSignedUploadUrl(path);
    check("signed upload url " + (n + 1), !se && !!signed?.token, se?.message);
    const { error: ue } = await anon.storage.from("gallery").uploadToSignedUrl(path, signed.token, await mk(40 * (n + 1), 100, 150), { contentType: "image/webp" });
    check("upload via publishable key + token " + (n + 1), !ue, ue?.message);
    const { data: row, error: ie } = await admin.from("images").insert({ album_id: album.id, storage_path: path, width: 640, height: 480, sort_order: n, tags: ["smoke"] }).select("id").single();
    check("insert image row " + (n + 1), !ie, ie?.message);
    ids.push({ id: row.id, path });
  }
  const { error: noTok } = await anon.storage.from("gallery").upload("albums/" + album.id + "/nope.webp", await mk(1, 2, 3), { contentType: "image/webp" });
  check("anon upload without signed token is refused", !!noTok);
  await admin.from("albums").update({ cover_image_id: ids[0].id }).eq("id", album.id);
  const pubUrl = admin.storage.from("gallery").getPublicUrl(ids[0].path).data.publicUrl;
  check("uploaded file is publicly readable", (await fetch(pubUrl)).status === 200);
  const gal = await fetch(site + "/en/gallery/" + slug);
  check("published album page renders (200)", gal.status === 200, "" + gal.status);
  // move the second image to album B (file + row), as moveImages does
  const newPath = "albums/" + album2.id + "/" + ids[1].path.split("/").pop();
  const mv = await admin.storage.from("gallery").move(ids[1].path, newPath);
  check("storage move between albums", !mv.error, mv.error?.message);
  await admin.from("images").update({ album_id: album2.id, storage_path: newPath }).eq("id", ids[1].id);
  // delete both albums the way deleteAlbum does: files first, then rows
  for (const a of [album, album2]) {
    const folder = "albums/" + a.id;
    const { data: files } = await admin.storage.from("gallery").list(folder);
    await admin.storage.from("gallery").remove((files ?? []).map((f) => folder + "/" + f.name));
    const { data: left } = await admin.storage.from("gallery").list(folder);
    check("storage folder clean: " + folder.slice(0, 16) + "...", (left ?? []).length === 0);
    await admin.from("albums").delete().eq("id", a.id);
  }
  const { data: rest } = await admin.from("images").select("id").in("id", ids.map((i) => i.id));
  check("image rows cascaded away", (rest ?? []).length === 0);
  const { data: gone } = await admin.from("albums").select("id").in("slug", [slug, slug + "-b"]);
  check("test albums removed", (gone ?? []).length === 0);
}

console.log(failed ? `\n${failed} check(s) failed` : "\nAll admin smoke checks passed");
process.exit(failed ? 1 : 0);
