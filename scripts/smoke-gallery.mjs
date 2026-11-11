// End-to-end smoke test for the Site Diary. Creates a temporary album, checks the pages and RLS, cleans up.
// Run (dev server on :3000): node --env-file=.env.local scripts/smoke-gallery.mjs
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
const pub = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const site = process.env.SMOKE_SITE ?? "http://localhost:3000";
if (!url || !secret || !pub) {
  console.log("env: missing Supabase env vars");
  process.exit(2);
}
const opts = { auth: { persistSession: false } };
const admin = createClient(url, secret, opts);
const anon = createClient(url, pub, opts);

const SLUG = "zz-smoke-test";
const TITLE = "ZZ Smoke Test Bridge";
let failed = 0;
const check = (name, ok, extra = "") => {
  if (!ok) failed++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${extra ? ` (${extra})` : ""}`);
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function png(r, g, b) {
  return sharp({ create: { width: 400, height: 300, channels: 3, background: { r, g, b } } })
    .png()
    .toBuffer();
}

async function cleanup() {
  const { data: alb } = await admin.from("albums").select("id").eq("slug", SLUG);
  for (const a of alb ?? []) {
    await admin.from("albums").update({ cover_image_id: null }).eq("id", a.id);
    await admin.from("images").delete().eq("album_id", a.id);
    await admin.from("albums").delete().eq("id", a.id);
  }
  const { data: objs } = await admin.storage.from("gallery").list(SLUG);
  if (objs?.length) await admin.storage.from("gallery").remove(objs.map((o) => `${SLUG}/${o.name}`));
}

try {
  await cleanup(); // in case of a previous aborted run

  const { data: album, error: aErr } = await admin
    .from("albums")
    .insert({
      slug: SLUG,
      title_en: TITLE,
      category: "bridges",
      event_date: "2024-03-12",
      location_en: "Smoke Town",
      published: true,
    })
    .select()
    .single();
  check("create album", !aErr && !!album, aErr?.message);
  if (!album) throw new Error("album not created");

  const paths = [];
  const rows = [];
  const colours = [
    [200, 80, 40],
    [40, 120, 200],
  ];
  for (let i = 0; i < 2; i++) {
    const path = `${SLUG}/smoke-${i + 1}.png`;
    const { error } = await admin.storage
      .from("gallery")
      .upload(path, await png(...colours[i]), { contentType: "image/png", upsert: true });
    check(`upload ${path}`, !error, error?.message);
    paths.push(path);
    rows.push({
      album_id: album.id,
      storage_path: path,
      width: 400,
      height: 300,
      caption_en: `Smoke caption ${i + 1}`,
      sort_order: i,
    });
  }
  const { data: imgs, error: iErr } = await admin.from("images").insert(rows).select();
  check("insert image rows", !iErr && imgs?.length === 2, iErr?.message);
  const { error: cErr } = await admin
    .from("albums")
    .update({ cover_image_id: imgs[0].id })
    .eq("id", album.id);
  check("set cover", !cErr, cErr?.message);

  await sleep(2000);

  const get = async (p) => {
    const r = await fetch(site + p);
    return { status: r.status, text: await r.text() };
  };
  const idx = await get("/en/gallery");
  check("/en/gallery 200", idx.status === 200, String(idx.status));
  check("/en/gallery shows title", idx.text.includes(TITLE));
  const en = await get(`/en/gallery/${SLUG}`);
  check(`/en/gallery/${SLUG} 200`, en.status === 200, String(en.status));
  check("album page shows title", en.text.includes(TITLE));
  check("album page shows caption", en.text.includes("Smoke caption 1"));
  const hi = await get(`/hi/gallery/${SLUG}`);
  check(`/hi/gallery/${SLUG} 200`, hi.status === 200, String(hi.status));
  check("hi album page shows title (EN fallback)", hi.text.includes(TITLE));

  for (const p of paths) {
    const r = await fetch(`${url}/storage/v1/object/public/gallery/${p}`);
    check(`public bucket URL ${p}`, r.status === 200, String(r.status));
  }

  // RLS with the publishable key
  const { data: seen } = await anon.from("albums").select("id").eq("slug", SLUG);
  check("anon can read published album", seen?.length === 1);
  const { data: seenImgs } = await anon.from("images").select("id").eq("album_id", album.id);
  check("anon can read images of published album", seenImgs?.length === 2);
  const ins = await anon.from("albums").insert({ slug: "zz-smoke-anon", title_en: "x" });
  check("anon cannot insert into albums", !!ins.error, ins.error?.code);
  const msg = await anon.from("messages").select("id");
  check("anon gets no rows from messages", !!msg.error || (msg.data ?? []).length === 0);
  const msgIns = await anon.from("messages").insert({ name: "x", email: "x@x.x", body: "x" });
  check("anon cannot insert into messages", !!msgIns.error, msgIns.error?.code);
  const up = await anon.storage
    .from("gallery")
    .upload(`${SLUG}/anon.png`, await png(1, 2, 3), { contentType: "image/png" });
  check("anon cannot upload to bucket", !!up.error, up.error?.message);

  // Unpublish
  await admin.from("albums").update({ published: false }).eq("id", album.id);
  const { data: hidden } = await anon.from("albums").select("id").eq("slug", SLUG);
  check("anon cannot see unpublished album", (hidden ?? []).length === 0);
  const { data: hiddenImgs } = await anon.from("images").select("id").eq("album_id", album.id);
  check("anon cannot see images of unpublished album", (hiddenImgs ?? []).length === 0);
} catch (e) {
  failed++;
  console.log(`ERROR  ${e.message}`);
} finally {
  await cleanup();
  const { data: a } = await admin.from("albums").select("id").like("slug", "zz-smoke%");
  const { data: o } = await admin.storage.from("gallery").list(SLUG);
  const { data: i } = await admin.from("images").select("id").like("storage_path", "zz-smoke%");
  const clean = !(a?.length || o?.length || i?.length);
  check("cleanup: nothing named zz-smoke remains", clean);
}
console.log(failed ? `\n${failed} check(s) FAILED` : "\nAll checks passed");
process.exit(failed ? 1 : 0);
