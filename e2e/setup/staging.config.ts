import { devices, PlaywrightTestConfig } from "@playwright/test";

const config: PlaywrightTestConfig = {
  expect: {
    timeout: 9000,
  },

  fullyParallel: true,
  globalSetup: "./setup/globalSetup",
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
  ],
  testDir: "../tests",
  timeout: 90000,
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
  workers: 10,
};

export default config;
