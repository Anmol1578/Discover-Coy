import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "node",
    globalSetup: ["./tests/global-setup.ts"],
    setupFiles: ["./tests/setup.ts"],
    env: {
      DATABASE_URL: "file:./test.db",
      NODE_ENV: "test",
      ENABLE_DEMO_RESET: "true",
    },
    fileParallelism: false,
  },
});
