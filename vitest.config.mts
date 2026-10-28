import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  oxc: { jsx: { runtime: "automatic" } },
  test: {
    environment: "jsdom",
    // Avoid intermittent child-process startup timeouts on Windows and keep
    // this small browser suite's memory use bounded after a Next.js build.
    pool: "threads",
    maxWorkers: 1,
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
