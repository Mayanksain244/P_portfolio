import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      // "server-only" throws outside the Next server bundle; stub it for unit tests.
      "server-only": path.resolve(import.meta.dirname, "src/__tests__/stubs/server-only.ts"),
    },
  },
  // Component tests opt in to jsdom with `// @vitest-environment jsdom`.
  test: {
    environment: "node",
    include: ["src/**/*.test.{ts,tsx}"],
    // next-intl imports "next/navigation" without an extension; inline it so Vite resolves it.
    server: { deps: { inline: ["next-intl"] } },
  },
});
