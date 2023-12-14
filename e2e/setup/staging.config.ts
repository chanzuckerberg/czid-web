import { devices, PlaywrightTestConfig } from "@playwright/test";

const config: PlaywrightTestConfig = {
  expect: {
    timeout: 9000,
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
  timeout: 60000,
  // retries: 3,
  use: {
    channel: "chromium",
    baseURL: "https://staging.czid.org",
    ignoreHTTPSErrors: true,
    screenshot: "only-on-failure",
    storageState: "/tmp/state.json",
    trace: "on",
    viewport: { width: 800, height: 7200 },
    permissions: ["clipboard-read"],
  },
  workers: 4,
};

export default config;
