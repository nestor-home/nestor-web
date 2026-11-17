import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "node",
    // files in a random order, to catch a test that leans on another; the seed is printed
    sequence: { shuffle: { files: true, tests: false } },
  },
});
