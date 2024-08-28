import { devices, PlaywrightTestConfig } from "@playwright/test";

const config: PlaywrightTestConfig = {
  expect: {
    timeout: 9000,
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
    [
      "html",
      {
        open: "never",
        outputFolder: "__assets__/html-report/",
        attachmentsBaseURL: "./",
      },
    ],
    [
      "json",
      {
        outputFile: "__assets__/json-report/report.json",
      },
    ],
  ],
  testDir: "../",
  timeout: parseInt(process.env.TIMEOUT) || 90000,
  use: {
    actionTimeout: 90000,
    channel: "chromium",
    baseURL: "https://staging.czid.org",
    ignoreHTTPSErrors: true,
    screenshot: "only-on-failure",
    storageState: "/tmp/state-staging.json",
    trace: "on",
    viewport: { width: 800, height: 7200 },
    permissions: ["clipboard-read"],
  },
  workers: 10,
};

export default config;
