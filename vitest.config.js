import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    setupFiles: ["./src/test/setup.js"],
    projects: [
      {
        extends: true,
        test: { name: "ui", environment: "jsdom", include: ["src/**/*.test.jsx"] },
      },
      {
        extends: true,
        test: { name: "server", environment: "node", include: ["src/**/*.test.js"] },
      },
    ],
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
