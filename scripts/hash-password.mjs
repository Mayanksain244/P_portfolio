// Prints a bcrypt hash (cost 12) for ADMIN_PASSWORD_HASH.
//
// Usage:
//   node scripts/hash-password.mjs "your-password"          prints the hash
//   node scripts/hash-password.mjs "pw" --write             writes ADMIN_PASSWORD_HASH= into .env.local
//   node scripts/hash-password.mjs "pw" --write --env-file path/to/.env.local
// (or pipe the password via stdin). With --write the hash is not printed; the script
// re-loads the file with @next/env, runs bcrypt.compare and prints only "verified: true/false".
import { copyFileSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import bcrypt from "bcryptjs";
import nextEnv from "@next/env";

const KEY = "ADMIN_PASSWORD_HASH";
// Next expands $VARS in .env files, so every $ in the hash must be written as backslash + $.
const BACKSLASH = String.fromCharCode(92);

async function readStdin() {
  const chunks = [];
  for await (const c of process.stdin) chunks.push(c);
  return Buffer.concat(chunks).toString("utf8").replace(/\r?\n$/, "");
}

export function escapeForEnvFile(hash) {
  return hash.split("$").join(BACKSLASH + "$");
}

/** Returns new file contents with the KEY line replaced (or appended). Splits on lines, never uses regex replacement strings ($ is special there). */
export function setEnvLine(contents, hash) {
  const eol = contents.includes("\r\n") ? "\r\n" : "\n";
  const line = `${KEY}=${escapeForEnvFile(hash)}`;
  const lines = contents === "" ? [] : contents.split(/\r?\n/);
  let replaced = false;
  const out = lines.map((l) => {
    if (!replaced && l.startsWith(`${KEY}=`)) {
      replaced = true;
      return line;
    }
    return l;
  });
  if (!replaced) {
    if (out.length && out[out.length - 1] === "") out.splice(out.length - 1, 0, line);
    else out.push(line, "");
  }
  return out.join(eol);
}

/** Loads the file exactly as Next does (via loadEnvConfig) and returns the stored hash. */
export function loadHashLikeNext(envFile) {
  const dir = mkdtempSync(path.join(tmpdir(), "envcheck-"));
  const saved = { hash: process.env[KEY], node: process.env.NODE_ENV };
  try {
    copyFileSync(envFile, path.join(dir, ".env.local"));
    delete process.env[KEY];
    // .env.local is skipped in NODE_ENV=test; force a normal mode for the check.
    process.env.NODE_ENV = "production";
    nextEnv.loadEnvConfig(dir, false, { info() {}, error() {} }, true);
    return process.env[KEY];
  } finally {
    rmSync(dir, { recursive: true, force: true });
    if (saved.hash === undefined) delete process.env[KEY];
    else process.env[KEY] = saved.hash;
    if (saved.node === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = saved.node;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const write = args.includes("--write");
  let envFile = ".env.local";
  const rest = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--write") continue;
    if (args[i] === "--env-file") {
      envFile = args[++i] ?? "";
      continue;
    }
    rest.push(args[i]);
  }
  if (!envFile) {
    console.error("--env-file needs a path");
    process.exit(1);
  }

  const password = rest[0] ?? (process.stdin.isTTY ? "" : await readStdin());
  if (!password) {
    console.error('Usage: node scripts/hash-password.mjs "your-password" [--write] [--env-file <path>]');
    process.exit(1);
  }
  const hash = await bcrypt.hash(password, 12);

  if (!write) {
    console.log(hash);
    console.error(
      "Note: in .env.local (Next.js expands $VARS) write each $ as backslash+$. On Vercel paste the hash as is. Use --write to do this automatically.",
    );
    return;
  }

  const file = path.resolve(envFile);
  const before = existsSync(file) ? readFileSync(file, "utf8") : "";
  writeFileSync(file, setEnvLine(before, hash), "utf8");
  const loaded = loadHashLikeNext(file);
  const ok = Boolean(loaded) && (await bcrypt.compare(password, loaded));
  console.log(`verified: ${ok}`);
  if (!ok) process.exit(1);
}

// Only run when executed directly (so the helpers can be imported).
if (process.argv[1]?.endsWith("hash-password.mjs")) {
  await main();
}
