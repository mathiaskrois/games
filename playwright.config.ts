import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/browser",
  workers: 1,
  timeout: 30000,
  reporter: "list",
  use: { baseURL: "http://127.0.0.1:4174", trace: "retain-on-failure", screenshot: "only-on-failure" },
  webServer: { command: "npm run preview", url: "http://127.0.0.1:4174/ord/", reuseExistingServer: !process.env.CI },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "iphone-webkit", use: { ...devices["iPhone 13"] } },
  ],
});
