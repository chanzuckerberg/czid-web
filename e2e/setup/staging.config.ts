import { PlaywrightTestConfig } from "@playwright/test";
import { devices } from "@playwright/test";
import dotenv from "dotenv";
import path from "path";

dotenv.config({
  path: path.resolve(__dirname, "../../", ".env.staging"),
});

const config: PlaywrightTestConfig = {
  expect: {
    timeout: 10000,
  },
  globalSetup: "./global-setup",
  outputDir: "../report",
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
      },
    },
  ],
  reporter: process.env.CI ? "github" : "list",
  testDir: "../tests",
  timeout: 30000,
  use: {
    actionTimeout: 0,
    channel: "chrome",
    baseURL: "https://staging.czid.org",
    ignoreHTTPSErrors: true,
    screenshot: "only-on-failure",
    storageState: "/tmp/state.json",
    trace: "on-first-retry",
  },
};
export default config;
