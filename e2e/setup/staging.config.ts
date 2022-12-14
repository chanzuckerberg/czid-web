import { PlaywrightTestConfig } from "@playwright/test";
import { devices } from "@playwright/test";
import dotenv from "dotenv";
import path from "path";

dotenv.config({
  path: path.resolve(__dirname, "../../", ".env.staging")
});

const config: PlaywrightTestConfig = {
  expect: {
    timeout: 60000,
  },
  fullyParallel: true,
  globalSetup: "./globalSetup",
  outputDir: "../report",
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        video: "on",
      },
    },
  ],
  reporter: "list",
  testDir: "../tests",
  timeout: 120000,
  use: {
    actionTimeout: 10000,
    channel: "chromium",
    baseURL: "https://staging.czid.org",
    ignoreHTTPSErrors: true,
    screenshot: "only-on-failure",
    storageState: "/tmp/state.json",
    trace: "on-first-retry",
    viewport: { width: 800, height: 7200 }
  }
};

export default config;
