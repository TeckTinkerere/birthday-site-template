import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  css: {
    // Stub CSS modules so PostCSS is never invoked during tests.
    // Class names become the key itself (e.g. styles.burn === "burn").
    modules: {
      classNameStrategy: "non-scoped",
    },
    postcss: {
      plugins: [],
    },
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    pool: "threads",
    setupFiles: ["./src/test-setup.js"],
  },
});
