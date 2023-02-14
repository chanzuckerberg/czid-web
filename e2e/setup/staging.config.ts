import path from "path";
import { PlaywrightTestConfig, devices } from "@playwright/test";

import dotenv from "dotenv";

dotenv.config({
  path: path.resolve(__dirname, "../../", ".env.staging"),
});

const config: PlaywrightTestConfig = {
  workers: 2,
  expect: {
    timeout: 20000,
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
  timeout: 50000,
  use: {
    actionTimeout: 20000,
    channel: "chromium",
    baseURL: "https://staging.czid.org",
    ignoreHTTPSErrors: true,
    screenshot: "only-on-failure",
    storageState: "/tmp/state.json",
    trace: "on-first-retry",
    viewport: { width: 800, height: 7200 },
  },
};

export default config;
