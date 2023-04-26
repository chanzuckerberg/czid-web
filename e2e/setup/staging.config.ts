import { devices, PlaywrightTestConfig } from "@playwright/test";
import dotenv from "dotenv";
import path from "path";

dotenv.config({
  path: path.resolve(__dirname, "../../", ".env.staging"),
});

const config: PlaywrightTestConfig = {
  expect: {
    timeout: 20000,
  },

  fullyParallel: true,
  globalSetup: "./globalSetup",
  outputDir: "../playwright-report",

  // repeatEach:10,
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
  timeout: 50000,
  use: {
    actionTimeout: 30000,
    channel: "chromium",
    baseURL: "https://staging.czid.org",
    ignoreHTTPSErrors: true,
    screenshot: "only-on-failure",
    storageState: "/tmp/state.json",
    trace: "on",
    viewport: { width: 800, height: 7200 },
  },
  workers: 2,
};

export default config;
