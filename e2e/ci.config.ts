import path from "path";
import { devices, PlaywrightTestConfig } from "@playwright/test";
import dotenv from "dotenv";

dotenv.config({
  path: path.resolve(__dirname, "../../", ".env.staging"),
});

const config: PlaywrightTestConfig = {
  expect: {
    timeout: 9000,
  },

  fullyParallel: true,
  globalSetup: "./setup/globalSetup",
  outputDir: "./playwright-report",

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
  testDir: "./tests",
  timeout: 90000,
  use: {
    channel: "chromium",
    baseURL: "http://localhost:3000",
    ignoreHTTPSErrors: true,
    screenshot: "only-on-failure",
    storageState: "/tmp/state.json",
    trace: "on",
    viewport: { width: 800, height: 7200 },
    permissions: ["clipboard-read"],
  },
  workers: 10,
};

export default config;
