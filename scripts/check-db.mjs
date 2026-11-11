// Reports whether the Phase 3 tables and storage bucket exist. Prints only yes/no.
// Run: node --env-file=.env.local scripts/check-db.mjs
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.log("env: missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(2);
}
const db = createClient(url, key, { auth: { persistSession: false } });

const yn = (b) => (b ? "yes" : "no");
let all = true;

for (const table of ["albums", "images", "messages"]) {
  // A real GET (not HEAD), so a missing table surfaces as an error.
  const { error } = await db.from(table).select("id").limit(1);
  const ok = !error;
  if (!ok) all = false;
  console.log(`table ${table}: ${yn(ok)}${ok ? "" : ` (${error.code ?? "error"})`}`);
}

const { data: buckets, error: bErr } = await db.storage.listBuckets();
const bucket = !bErr && (buckets ?? []).find((b) => b.name === "gallery");
if (!bucket) all = false;
console.log(`bucket gallery: ${yn(!!bucket)}${bucket ? ` (public: ${yn(bucket.public)})` : ""}`);

console.log(`all present: ${yn(all)}`);
process.exit(all ? 0 : 1);
