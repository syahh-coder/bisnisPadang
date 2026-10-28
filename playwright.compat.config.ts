import { defineConfig } from "@playwright/test";
import base from "./playwright.config";

export default defineConfig({
  ...base,
  workers: 1,
  outputDir: "test-results/compat",
  projects: [
    { name: "webkit-hp", use: { browserName: "webkit", viewport: { width: 360, height: 800 } } },
    { name: "webkit-desktop", use: { browserName: "webkit", viewport: { width: 1440, height: 900 } } },
    { name: "firefox-hp", use: { browserName: "firefox", viewport: { width: 360, height: 800 } } },
    { name: "firefox-desktop", use: { browserName: "firefox", viewport: { width: 1440, height: 900 } } },
  ],
});
