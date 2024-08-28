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
  reporter: [["json", { outputFile: "report.json" }]],
  testDir: "../",
  timeout: parseInt(process.env.TIMEOUT) || 100000,
  use: {
    channel: "chromium",
    baseURL: "https://czid.org",
    ignoreHTTPSErrors: true,
    screenshot: "only-on-failure",
    storageState: "/tmp/state-prod.json",
    trace: "on",
    viewport: { width: 800, height: 7200 },
    permissions: ["clipboard-read"],
  },
  workers: 10,
};

export default config;
