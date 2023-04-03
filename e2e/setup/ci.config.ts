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
    ["github"],
    [
      "html",
      {
        open: "never",
        outputFolder: "../html-reports",
      },
    ],
  ],
  testDir: "../tests",
  timeout: 120000,
  use: {
    actionTimeout: 0,
    baseURL: "http://localhost:3000",
    headless: true,
    ignoreHTTPSErrors: false,
    storageState: "/tmp/state.json",
    trace: "retain-on-failure",
    video: "on",
  },
};
export default config;
