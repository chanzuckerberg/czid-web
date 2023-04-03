import path from "path";
import { devices, PlaywrightTestConfig } from "@playwright/test";
import dotenv from "dotenv";

dotenv.config({
  path: path.resolve(__dirname, "../../", ".env.dev"),
});

const config: PlaywrightTestConfig = {
  expect: {
    timeout: 120000,
  },
  fullyParallel: true,
  globalSetup: "./globalSetup",
  outputDir: "../playwright-report",
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        video: "on",
      },
    },
  ],
  reporter: [
    ["list"],
    [
      "html",
      {
        open: "failure",
        host: "localhost",
        port: 9220,
        outputFolder: "../html-reports",
      },
    ],
  ],
  testDir: "../tests",
  timeout: 600000,
  use: {
    actionTimeout: 30000,
    baseURL: "http://localhost:3000",
    headless: true,
    ignoreHTTPSErrors: true,
    screenshot: "only-on-failure",
    storageState: "/tmp/state.json",
    trace: "on-first-retry",
    video: "on",
  },
};
export default config;
