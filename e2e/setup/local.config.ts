import { devices, PlaywrightTestConfig } from "@playwright/test";

const config: PlaywrightTestConfig = {
  expect: {
    timeout: 120000,
  },
  fullyParallel: true,
  globalSetup: require.resolve("@e2e/setup/globalSetup"),
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
  testDir: "../",
  timeout: 600000,
  use: {
    actionTimeout: 240000,
    baseURL: "http://localhost:3000",
    headless: false,
    ignoreHTTPSErrors: true,
    screenshot: "only-on-failure",
    storageState: "/tmp/state-local.json",
    trace: "on-first-retry",
    video: "on",
    permissions: ["clipboard-read"],
  },
};
export default config;
