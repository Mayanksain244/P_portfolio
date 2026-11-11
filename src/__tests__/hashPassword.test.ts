import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import bcrypt from "bcryptjs";
import nextEnv from "@next/env";
import { afterEach, describe, expect, it, vi } from "vitest";

const script = path.resolve(__dirname, "../../scripts/hash-password.mjs");
const dirs: string[] = [];
afterEach(() => {
  vi.unstubAllEnvs();
  while (dirs.length) rmSync(dirs.pop()!, { recursive: true, force: true });
});

function run(envFile: string, password: string) {
  return execFileSync(process.execPath, [script, password, "--write", "--env-file", envFile], {
    encoding: "utf8",
    env: { ...process.env, NODE_ENV: "production" },
  }).trim();
}

describe("hash-password --write", () => {
  it("writes an escaped hash that round-trips through loadEnvConfig", () => {
    const dir = mkdtempSync(path.join(tmpdir(), "hp-"));
    dirs.push(dir);
    const file = path.join(dir, ".env.local");
    writeFileSync(file, "FOO=bar\r\nADMIN_PASSWORD_HASH=old\r\nBAZ=1\r\n");

    const out = run(file, "s3cret$pass");
    expect(out).toBe("verified: true");

    const raw = readFileSync(file, "utf8");
    const BS = String.fromCharCode(92);
    expect(raw).toContain(`ADMIN_PASSWORD_HASH=${BS}$2b${BS}$12${BS}$`);
    expect(raw).toContain("FOO=bar\r\n");
    expect(raw).toContain("BAZ=1");
    expect(raw.match(/ADMIN_PASSWORD_HASH=/g)).toHaveLength(1);

    vi.stubEnv("NODE_ENV", "production");
    delete process.env.ADMIN_PASSWORD_HASH;
    nextEnv.loadEnvConfig(dir, false, { info() {}, error() {} }, true);
    const loaded = process.env.ADMIN_PASSWORD_HASH!;
    expect(loaded.startsWith("$2b$12$")).toBe(true);
    expect(bcrypt.compareSync("s3cret$pass", loaded)).toBe(true);
    expect(bcrypt.compareSync("wrong", loaded)).toBe(false);
    delete process.env.ADMIN_PASSWORD_HASH;
  });

  it("appends the line when the key is absent", () => {
    const dir = mkdtempSync(path.join(tmpdir(), "hp-"));
    dirs.push(dir);
    const file = path.join(dir, ".env.local");
    // node itself requires an --env-file target to exist, so start with an empty file
    writeFileSync(file, "");
    expect(run(file, "abc12345")).toBe("verified: true");
    expect(readFileSync(file, "utf8")).toMatch(/^ADMIN_PASSWORD_HASH=/);
  });

  it("without --write only prints the raw hash", () => {
    const out = execFileSync(process.execPath, [script, "pw12345"], { encoding: "utf8" }).trim();
    expect(bcrypt.compareSync("pw12345", out)).toBe(true);
  });
});
