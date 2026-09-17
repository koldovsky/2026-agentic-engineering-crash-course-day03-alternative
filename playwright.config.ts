import { defineConfig, devices } from "@playwright/test";
import { resolve } from "node:path";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: "list",
  use: { baseURL: "http://127.0.0.1:3100", trace: "retain-on-failure" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run start -- --port 3100",
    url: "http://127.0.0.1:3100",
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      TOKEN_ATLAS_DB: resolve(
        "test-results",
        `acceptance-${Date.now()}.sqlite`,
      ),
      NEXT_TELEMETRY_DISABLED: "1",
      // Browser acceptance must only read the checked-in synthetic provider logs.
      CLAUDE_CONFIG_DIR: resolve("samples/machine-import/claude"),
      CODEX_HOME: resolve("samples/machine-import/codex"),
    },
  },
});
