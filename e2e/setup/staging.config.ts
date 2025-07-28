import { devices, PlaywrightTestConfig } from "@playwright/test";

const DESKTOP_CHROME = "Desktop Chrome";
const VIDEO_CONFIG = "retain-on-failure";

const config: PlaywrightTestConfig = {
  expect: {
    timeout: 9000,
  },
  fullyParallel: true,
  globalSetup: require.resolve("@e2e/setup/globalSetup"),
  outputDir: "../playwright-report",
  projects: [
    {
      name: "e2e test: Functional: AMR E Coli aadS upload",
      testMatch: ["tests/amr/amr-discovery-view.spec.ts"],
      use: {
        ...devices[DESKTOP_CHROME],
        video: VIDEO_CONFIG,
      },
      grep: /SNo 1:/,
    },
    {
      name: "e2e test: Data Validation: AMR E Coli aadS Discovery View data",
      testMatch: ["tests/amr/amr-discovery-view.spec.ts"],
      use: {
        ...devices[DESKTOP_CHROME],
        video: VIDEO_CONFIG,
      },
      grep: /Check data in discovery view/,
    },
    {
      name: "e2e test: Functional: P-2: AMR - E Coli cfxA sample report",
      testMatch: ["tests/amr/amr-sample-report.spec.ts"],
      use: {
        ...devices[DESKTOP_CHROME],
        video: VIDEO_CONFIG,
      },
      grep: /SNo/,
    },
    {
      name: "e2e test: Functional: P-1",
      testMatch: ["tests/amr/amr-e2e.spec.ts"],
      use: {
        ...devices[DESKTOP_CHROME],
        video: VIDEO_CONFIG,
      },
      grep: /SNo e*/,
    },
    {
      name: "e2e test: Functional: P-1",
      testMatch: ["tests/mngs/mngs-e2e.spec.ts"],
      use: {
        ...devices[DESKTOP_CHROME],
        video: VIDEO_CONFIG,
      },
      grep: /SNo e*/,
    },
    {
      name: "e2e test: mNGS IP: Functional: P-0",
      testMatch: ["tests/mngs/sample-upload.spec.ts"],
      use: {
        ...devices[DESKTOP_CHROME],
        video: VIDEO_CONFIG,
      },
      grep: /mNGS-*/,
    },
    {
      name: "e2e test: Functional P-1: short mNGS - CG run: SNo 34: CG run kick off from short mNGS - OldIndex",
      testMatch: ["tests/consensusGenome/short-mngs.spec.ts"],
      use: {
        ...devices[DESKTOP_CHROME],
        video: VIDEO_CONFIG,
      },
      grep: /SNo 34: CG run kick off from short mNGS - OldIndex/,
    },
    {
      name: "e2e test: Functional P-1: short mNGS - CG run: SNo 35: CG run kick off from short mNGS - NewIndex",
      testMatch: ["tests/consensusGenome/short-mngs.spec.ts"],
      use: {
        ...devices[DESKTOP_CHROME],
        video: VIDEO_CONFIG,
      },
      grep: /SNo 35: CG run kick off from short mNGS - NewIndex/,
    },
    {
      name: "e2e test: Functional: P-0: SNo SC2-42: Project count when CG running from mNGS",
      testMatch: ["tests/sc2/cg-project-count.spec.ts"],
      use: {
        ...devices[DESKTOP_CHROME],
        video: VIDEO_CONFIG,
      },
      grep: /SNo SC2-42: Project count when CG running from mNGS/,
    },
    {
      name: "e2e test: Functional: P-0",
      testMatch: ["tests/sc2/sample-upload.spec.ts"],
      use: {
        ...devices[DESKTOP_CHROME],
        video: VIDEO_CONFIG,
      },
      grep: /SNo */,
    },
    {
      name: "e2e test: E2E: P-1",
      testMatch: ["tests/wgs/sample-report.spec.ts"],
      use: {
        ...devices[DESKTOP_CHROME],
        video: VIDEO_CONFIG,
      },
      grep: /SNo e*/,
    },
    {
      name: "e2e test: Functional: P-0: WGS - Sample upload (web) Basespace project",
      testMatch: ["tests/wgs/sample-upload-basespace.spec.ts"],
      use: {
        ...devices[DESKTOP_CHROME],
        video: VIDEO_CONFIG,
      },
      grep: /SNo */,
    },
    {
      name: "e2e test: Functional: P-0: WGS - Sample upload: SNo 1: Viral Consensus Genome - No trim",
      testMatch: ["tests/wgs/sample-upload.spec.ts"],
      use: {
        ...devices[DESKTOP_CHROME],
        video: VIDEO_CONFIG,
      },
      grep: /SNo */,
    },
    {
      name: "smoke test: Functional: P-0: MHF NCBI Index",
      testMatch: ["tests/mngs/mhf-ncbi-index.spec.ts"],
      use: {
        ...devices[DESKTOP_CHROME],
        video: VIDEO_CONFIG,
      },
      grep: /mNGS-[0-9]+/,
    },
    {
      name: "smoke test: Functional: P-0: Heatmap Happy Path",
      testMatch: ["tests/heatmap/heatmap-happy-path.spec.ts"],
      use: {
        ...devices[DESKTOP_CHROME],
        video: VIDEO_CONFIG,
      },
      grep: /SNo/,
    },
    {
      name: "smoke test: Functional: P-1: Heatmap Top Links",
      testMatch: ["tests/heatmap/heatmap-top-links.spec.ts"],
      use: {
        ...devices[DESKTOP_CHROME],
        video: VIDEO_CONFIG,
      },
      grep: /SNo/,
    },
    {
      name: "smoke test: Functional: P-1: Heatmap Downloads",
      testMatch: ["tests/heatmap/heatmap-downloads.spec.ts"],
      testIgnore: ["tests/heatmap/heatmap-downloads.spec.ts-snapshots/*"],
      use: {
        ...devices[DESKTOP_CHROME],
        video: VIDEO_CONFIG,
      },
      grep: /SNo/,
    },
    {
      name: "smoke test: Functional: P-1: long mNGS - Coverage Visualization",
      testMatch: ["tests/coverageViz/long-mngs.spec.ts"],
      use: {
        ...devices[DESKTOP_CHROME],
        video: VIDEO_CONFIG,
      },
      grep: /SNo/,
    },
    {
      name: "smoke test: Functional: P-1: short mNGS - Coverage Visualization",
      testMatch: ["tests/coverageViz/short-mngs.spec.ts"],
      use: {
        ...devices[DESKTOP_CHROME],
        video: VIDEO_CONFIG,
      },
      grep: /SNo/,
    },
    {
      name: "smoke test: Functional: P-1: short mNGS - BLASTX",
      testMatch: ["tests/blastn/short-mngs-blastx.spec.ts"],
      use: {
        ...devices[DESKTOP_CHROME],
        video: VIDEO_CONFIG,
      },
      grep: /SNo/,
    },
    {
      name: "smoke test: Functional: P-1: short mNGS - BLASTN",
      testMatch: ["tests/blastn/short-mngs-blastn.spec.ts"],
      use: {
        ...devices[DESKTOP_CHROME],
        video: VIDEO_CONFIG,
      },
      grep: /SNo/,
    },
    {
      name: "smoke test: Functional: P-0: Create BG model",
      testMatch: ["tests/background/create-background.spec.ts"],
      use: {
        ...devices[DESKTOP_CHROME],
        video: VIDEO_CONFIG,
      },
      grep: /SNo/,
    },
    {
      name: "smoke test: smoke test: impact page",
      testMatch: ["tests/impact/impact.smoke.spec.ts"],
      use: {
        ...devices[DESKTOP_CHROME],
        video: VIDEO_CONFIG,
      },
    },
    {
      name: "smoke test: Functional: P-0: Taxon heatmap",
      testMatch: ["tests/heatmap/taxon-heatmap-tests.spec.ts"],
      use: {
        ...devices[DESKTOP_CHROME],
        video: VIDEO_CONFIG,
      },
      grep: /Functional: P-0: Taxon heatmap/,
    },
    {
      name: "smoke test: Data report validation (Heatmap): SNo 34",
      testMatch: ["tests/heatmap/heatmap-data-validation.spec.ts"],
      use: {
        ...devices[DESKTOP_CHROME],
        video: VIDEO_CONFIG,
      },
      grep: /SNo 34/,
    },
    {
      name: "smoke test: Heatmap Proper: SNo 7: Filters",
      testMatch: ["tests/heatmap/heatmap-proper.spec.ts"],
      use: {
        ...devices[DESKTOP_CHROME],
        video: VIDEO_CONFIG,
      },
      grep: /SNo 7: Filters/,
    },
    {
      name: "smoke test: PLQC: SNo 1",
      testMatch: ["tests/plqc/plqc-e2e.spec.ts"],
      use: {
        ...devices[DESKTOP_CHROME],
        video: VIDEO_CONFIG,
      },
      grep: /SNo 1: PLQC QA test/,
    },
    {
      name: "smoke test: SC2: Functional: P-1: Sample upload (web) Illumina",
      testMatch: ["tests/sc2/sample-upload-p1.spec.ts"],
      use: {
        ...devices[DESKTOP_CHROME],
        video: VIDEO_CONFIG,
      },
      grep: /Functional: P-1/,
    },
    {
      name: "smoke test: SC2: Functional: P-0: Sample view list",
      testMatch: ["tests/sc2/sample-view-list.spec.ts"],
      use: {
        ...devices[DESKTOP_CHROME],
        video: VIDEO_CONFIG,
      },
      grep: /Functional: P-0/,
    },
    {
      name: "smoke test: SC2: Functional: P-0: Delete samples",
      testMatch: ["tests/sc2/delete-samples.spec.ts"],
      use: {
        ...devices[DESKTOP_CHROME],
        video: VIDEO_CONFIG,
      },
      grep: /Functional: P-0/,
    },
    {
      name: "smoke test: WGS: Functional: P-1: Project View",
      testMatch: ["tests/wgs/project-view.spec.ts"],
      use: {
        ...devices[DESKTOP_CHROME],
        video: VIDEO_CONFIG,
      },
      grep: /Functional: P-1/,
    },
    {
      name: "smoke test: WGS: Functional: P-0: Delete samples",
      testMatch: ["tests/wgs/delete-samples.spec.ts"],
      use: {
        ...devices[DESKTOP_CHROME],
        video: VIDEO_CONFIG,
      },
      grep: /Functional: P-0/,
    },
    {
      name: "smoke test: WGS: Functional: P-0: NextClade Tree",
      testMatch: ["tests/wgs/nextclade.spec.ts"],
      use: {
        ...devices[DESKTOP_CHROME],
        video: VIDEO_CONFIG,
      },
      grep: /Functional: P-0/,
    },
    {
      name: "smoke test: SC2: Functional: P-0: NextClade Tree",
      testMatch: ["tests/sc2/nextclade-tree.spec.ts"],
      use: {
        ...devices[DESKTOP_CHROME],
        video: VIDEO_CONFIG,
      },
      grep: /Functional: P-0/,
    },
    {
      name: "smoke test: Functional: P-2: Viral CG (WGS) - Sample upload (web) Nanopore unavailable",
      testMatch: ["tests/wgs/viral-cg-sample-upload.spec.ts"],
      use: {
        ...devices[DESKTOP_CHROME],
        video: VIDEO_CONFIG,
      },
      grep: /Functional: P-2/,
    },
    {
      name: "smoke test: Functional: P-1: Viral CG (WGS) - Sample report",
      testMatch: ["tests/wgs/viral-cg-sample-report.spec.ts"],
      use: {
        ...devices[DESKTOP_CHROME],
        video: VIDEO_CONFIG,
      },
      grep: /Functional: P-1/,
    },
    {
      name: "smoke test: Functional: P-2: Viral CG (WGS) - Sample report",
      testMatch: ["tests/wgs/viral-cg-sample-report.spec.ts"],
      use: {
        ...devices[DESKTOP_CHROME],
        video: VIDEO_CONFIG,
      },
      grep: /Functional: P-2/,
    },
    {
      name: "smoke test: Functional: P-2: Viral CG (WGS) - Downloads (CURL)",
      testMatch: ["tests/wgs/viral-cg-downloads-curl.spec.ts"],
      use: {
        ...devices[DESKTOP_CHROME],
        video: VIDEO_CONFIG,
      },
      grep: /Functional: P-2/,
    },
    {
      name: "smoke test: Functional: P-0: WGS - Downloads",
      testMatch: ["tests/wgs/downloads.spec.ts"],
      use: {
        ...devices[DESKTOP_CHROME],
        video: VIDEO_CONFIG,
      },
      grep: /Functional: P-0/,
    },
    {
      name: "smoke test: Functional: P-0: WGS - Downloads (CURL)",
      testMatch: ["tests/wgs/downloads-curl.spec.ts"],
      use: {
        ...devices[DESKTOP_CHROME],
        video: VIDEO_CONFIG,
      },
      grep: /Functional: P-0/,
    },
    {
      name: "smoke test: Data Validation: P-0: Viral CG (WGS) - Report files",
      testMatch: ["tests/wgs/report-files.spec.ts"],
      use: {
        ...devices[DESKTOP_CHROME],
        video: VIDEO_CONFIG,
      },
      grep: /Data Validation: P-0/,
    },
    {
      name: "smoke test: Data Validation: P-0: Viral CG (WGS) - Sample report: Values & Data type",
      testMatch: ["tests/wgs/sample-report-values-and-data-type.spec.ts"],
      use: {
        ...devices[DESKTOP_CHROME],
        video: VIDEO_CONFIG,
      },
      grep: /Data Validation: P-0/,
    },
    {
      name: "smoke test: Data Validation: P-0: WGS - Sample report",
      testMatch: ["tests/wgs/sample-report-p0.spec.ts"],
      use: {
        ...devices[DESKTOP_CHROME],
        video: VIDEO_CONFIG,
      },
      grep: /Data Validation: P-0/,
    },
    {
      name: "smoke test: Data Validation: P-0: WGS - Sample upload: Error handling",
      testMatch: ["tests/wgs/sample-upload-error-handling.spec.ts"],
      use: {
        ...devices[DESKTOP_CHROME],
        video: VIDEO_CONFIG,
      },
      grep: /Data Validation: P-0/,
    },
    {
      name: "smoke test: Bulk Download: AMR",
      testMatch: ["tests/download/bulk-download-amr-smoke.spec.ts"],
      use: {
        ...devices[DESKTOP_CHROME],
        video: VIDEO_CONFIG,
      },
      grep: /Bulk Download: AMR/,
    },
    {
      name: "smoke test: Bulk Download: LMNGS",
      testMatch: ["tests/download/bulk-download-lmngs-smoke.spec.ts"],
      use: {
        ...devices[DESKTOP_CHROME],
        video: VIDEO_CONFIG,
      },
      grep: /Bulk Download: LMNGS/,
    },
    {
      name: "smoke test: Bulk Download: MNGS",
      testMatch: ["tests/download/bulk-download-mngs-smoke.spec.ts"],
      use: {
        ...devices[DESKTOP_CHROME],
        video: VIDEO_CONFIG,
      },
      grep: /Bulk Download: MNGS/,
    },
    {
      name: "smoke test: Bulk Download: WGS",
      testMatch: ["tests/download/bulk-download-wgs-smoke.spec.ts"],
      use: {
        ...devices[DESKTOP_CHROME],
        video: VIDEO_CONFIG,
      },
      grep: /Bulk Download: WGS/,
    },
    {
      name: "smoke test: Pipeline Visualization",
      testMatch: ["tests/view/pipeline-visualization-smoke.spec.ts"],
      use: {
        ...devices[DESKTOP_CHROME],
        video: VIDEO_CONFIG,
      },
      grep: /Pipeline Visualization/,
    },
    {
      name: "smoke test: Sample Deletion smoke tests",
      testMatch: ["tests/sample/sample-deletion-smoke.spec.ts"],
      use: {
        ...devices[DESKTOP_CHROME],
        video: VIDEO_CONFIG,
      },
      grep: /Smoke Test: Delete/,
    },
    {
      name: "smoke test: Sample Report Filter smoke tests",
      testMatch: ["tests/sampleReport/sample-report-filters.spec.ts"],
      use: {
        ...devices[DESKTOP_CHROME],
        video: VIDEO_CONFIG,
      },
      grep: /Sample report filter test/,
    },
    {
      name: "smoke test: Sample Upload smoke tests",
      testMatch: ["upload/upload-smoke.spec.ts"],
      use: {
        ...devices[DESKTOP_CHROME],
        video: VIDEO_CONFIG,
      },
      grep: /Upload Smoke Tests/,
    },
    {
      name: "smoke test: Coverage Viz smoke tests",
      testMatch: ["tests/sampleReport/sample-report-coverage-viz.spec.ts"],
      use: {
        ...devices[DESKTOP_CHROME],
        video: VIDEO_CONFIG,
      },
      grep: /Coverage Viz Smoke Tests/,
    },
    {
      name: "smoke test: Sample Heatmap",
      testMatch: ["tests/sample/sample-heatmap-smoke.spec.ts"],
      use: {
        ...devices[DESKTOP_CHROME],
        video: VIDEO_CONFIG,
      },
      grep: /Sample Heatmap/,
    },
  ],
  reporter: [["list"], process.env.CI ? ["github"] : ["null"]],
  testDir: "../",
  timeout: parseInt(process.env.TIMEOUT) || 120_000,
  retries: 4,
  use: {
    actionTimeout: 120_000,
    channel: "chromium",
    baseURL: "https://staging.czid.org",
    ignoreHTTPSErrors: true,
    screenshot: "only-on-failure",
    storageState: "/tmp/state-staging.json",
    trace: "on",
    viewport: { width: 1600, height: 900 },
    permissions: ["clipboard-read"],
    headless: true,
  },
  workers: "100%",
};

export default config;
