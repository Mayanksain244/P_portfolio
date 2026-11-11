// Prints a bcrypt hash (cost 12) for ADMIN_PASSWORD_HASH.
// Usage: node scripts/hash-password.mjs "your-password"   (or pipe the password via stdin)
import bcrypt from "bcryptjs";

async function readStdin() {
  const chunks = [];
  for await (const c of process.stdin) chunks.push(c);
  return Buffer.concat(chunks).toString("utf8").replace(/\r?\n$/, "");
}

const password = process.argv[2] ?? (process.stdin.isTTY ? "" : await readStdin());
if (!password) {
  console.error('Usage: node scripts/hash-password.mjs "your-password"');
  process.exit(1);
}
console.log(await bcrypt.hash(password, 12));
console.error(
  "Note: in .env.local (Next.js expands $VARS) write each $ as \$ . On Vercel paste the hash as is.",
);
