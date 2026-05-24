import { defineConfig } from "vitest/config";
import path from "node:path";

const alias = {
  "@": path.resolve(__dirname, "."),
};

export default defineConfig({
  resolve: { alias },
  test: {
    projects: [
      {
        resolve: { alias },
        test: {
          name: "unit",
          include: ["lib/**/*.test.ts"],
          exclude: ["lib/generated/**", "tests/**"],
          environment: "node",
          sequence: { groupOrder: 0 },
        },
      },
      {
        resolve: { alias },
        // pool/poolOptions/fileParallelism work at runtime but the
        // ProjectConfig type doesn't include them in vitest 4.
        test: {
          name: "integration",
          include: ["tests/integration/**/*.test.ts"],
          environment: "node",
          globalSetup: ["./tests/integration/globalSetup.ts"],
          setupFiles: ["./tests/integration/setup.ts"],
          pool: "forks",
          // @ts-expect-error see https://vitest.dev/guide/migration#pool-rework
          poolOptions: { forks: { singleFork: true } },
          fileParallelism: false,
          isolate: false,
          sequence: { concurrent: false, groupOrder: 1 },
        },
      },
    ],
  },
});
