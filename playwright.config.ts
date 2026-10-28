import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  outputDir: "test-results/chromium",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  workers: 2,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "hp-360", use: { viewport: { width: 360, height: 800 } } },
    { name: "tablet-640", use: { viewport: { width: 640, height: 900 } } },
    { name: "desktop", use: { viewport: { width: 1440, height: 900 } } },
  ],
  webServer: [
    {
      command: "node tests/support/catalog-api.mjs",
      url: "http://127.0.0.1:3101/health",
      timeout: 60_000,
    },
    {
      command: "node node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port 3000",
      url: "http://127.0.0.1:3000",
      env: {
        CATALOG_MODE: "supabase",
        NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:3101",
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "catalog-test-publishable-key",
      },
      timeout: 60_000,
    },
    {
      command: "node node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port 3002",
      url: "http://127.0.0.1:3002",
      env: { CATALOG_MODE: "demo", NEXT_PUBLIC_SUPABASE_URL: "", NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "" },
      timeout: 60_000,
    },
  ],
});
