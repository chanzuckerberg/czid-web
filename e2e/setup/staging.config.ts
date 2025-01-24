import { devices, PlaywrightTestConfig } from "@playwright/test";

const DESKTOP_CHROME = "Desktop Chrome";
const AMR_E2E_SPEC_PATH = "tests/amr/amr-e2e.spec.ts";
const MNGS_E2E_SPEC_PATH = "tests/mngs/mngs-e2e.spec.ts";
const MNGS_UPLOAD_SPEC_PATH = "tests/mngs/sample-upload.spec.ts";
const SC2_UPLOAD_SPEC_PATH = "tests/sc2/sample-upload.spec.ts";
const WGS_SAMPLE_REPORT_SPEC_PATH = "tests/wgs/sample-report.spec.ts";
const WGS_SAMPLE_UPLOAD_BASESPACE_SPEC_PATH =
  "tests/wgs/sample-upload-basespace.spec.ts";
const WGS_SAMPLE_UPLOAD_SPEC_PATH = "tests/wgs/sample-upload.spec.ts";

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
      name: "e2e test: Functional: P-1: SNo e13: AMR Paired Read RNA Human Sample Report & Download Data Validation",
      testMatch: [AMR_E2E_SPEC_PATH],
      use: {
        ...devices[DESKTOP_CHROME],
        video: VIDEO_CONFIG,
      },
      grep: /SNo e13: AMR Paired Read RNA Human Sample Report & Download Data Validation/,
    },
    {
      name: "e2e test: Functional: P-1: SNo e12: AMR Paired Read RNA Mosquito Sample Report & Download Data Validation",
      testMatch: [AMR_E2E_SPEC_PATH],
      use: {
        ...devices[DESKTOP_CHROME],
        video: VIDEO_CONFIG,
      },
      grep: /SNo e12: AMR Paired Read RNA Mosquito Sample Report & Download Data Validation/,
    },
    {
      name: "e2e test: Functional: P-1: SNo e11: AMR Paired Read Sample Report & Download Data Validation",
      testMatch: [AMR_E2E_SPEC_PATH],
      use: {
        ...devices[DESKTOP_CHROME],
        video: VIDEO_CONFIG,
      },
      grep: /SNo e11: AMR Paired Read Sample Report & Download Data Validation/,
    },
    {
      name: "e2e test: Functional: P-1: SNo e10: AMR Single Read Sample Report & Data Validation",
      testMatch: [AMR_E2E_SPEC_PATH],
      use: {
        ...devices[DESKTOP_CHROME],
        video: VIDEO_CONFIG,
      },
      grep: /SNo e10: AMR Single Read Sample Report & Data Validation/,
    },
    {
      name: "e2e test: Functional: P-1: SNo e9: mNGS Illumina Paired Read RNA Human Sample Report & Download Data Validation",
      testMatch: [MNGS_E2E_SPEC_PATH],
      use: {
        ...devices[DESKTOP_CHROME],
        video: VIDEO_CONFIG,
      },
      grep: /SNo e9: mNGS Illumina Paired Read RNA Human Sample Report & Download Data Validation/,
    },
    {
      name: "e2e test: Functional: P-1: SNo e19: mNGS Illumina Paired Read RNA Human Sample Report & Download Data Validation - New database",
      testMatch: [MNGS_E2E_SPEC_PATH],
      use: {
        ...devices[DESKTOP_CHROME],
        video: VIDEO_CONFIG,
      },
      grep: /SNo e19: mNGS Illumina Paired Read RNA Human Sample Report & Download Data Validation - New database/,
    },
    {
      name: "e2e test: Functional: P-1: SNo e6: mNGS Illumina Single Read Sample Report & Download Data Validation",
      testMatch: [MNGS_E2E_SPEC_PATH],
      use: {
        ...devices[DESKTOP_CHROME],
        video: VIDEO_CONFIG,
      },
      grep: /SNo e6: mNGS Illumina Single Read Sample Report & Download Data Validation/,
    },
    {
      name: "e2e test: Functional: P-1: SNo e16: mNGS Illumina Single Read Sample Report & Download Data Validation - New database",
      testMatch: [MNGS_E2E_SPEC_PATH],
      use: {
        ...devices[DESKTOP_CHROME],
        video: VIDEO_CONFIG,
      },
      grep: /SNo e16: mNGS Illumina Single Read Sample Report & Download Data Validation - New database/,
    },
    {
      name: "e2e test: Functional: P-1: SNo e8: mNGS Illumina Paired Read RNA Mosquito Sample Report & Download Data Validation",
      testMatch: [MNGS_E2E_SPEC_PATH],
      use: {
        ...devices[DESKTOP_CHROME],
        video: VIDEO_CONFIG,
      },
      grep: /SNo e8: mNGS Illumina Paired Read RNA Mosquito Sample Report & Download Data Validation/,
    },
    {
      name: "e2e test: Functional: P-1: SNo e18: mNGS Illumina Paired Read RNA Mosquito Sample Report & Download Data Validation - New database",
      testMatch: [MNGS_E2E_SPEC_PATH],
      use: {
        ...devices[DESKTOP_CHROME],
        video: VIDEO_CONFIG,
      },
      grep: /SNo e18: mNGS Illumina Paired Read RNA Mosquito Sample Report & Download Data Validation - New database/,
    },
    {
      name: "e2e test: Functional: P-1: SNo e7: mNGS Illumina Paired Read Sample Report & Download Data Validation",
      testMatch: [MNGS_E2E_SPEC_PATH],
      use: {
        ...devices[DESKTOP_CHROME],
        video: VIDEO_CONFIG,
      },
      grep: /SNo e7: mNGS Illumina Paired Read Sample Report & Download Data Validation/,
    },
    {
      name: "e2e test: Functional: P-1: SNo e17: mNGS Illumina Paired Read Sample Report & Download Data Validation - New database",
      testMatch: [MNGS_E2E_SPEC_PATH],
      use: {
        ...devices[DESKTOP_CHROME],
        video: VIDEO_CONFIG,
      },
      grep: /SNo e17: mNGS Illumina Paired Read Sample Report & Download Data Validation - New database/,
    },
    {
      name: "e2e test: mNGS IP: Functional: P-0: mNGS-3: long mNGS Illumina sample Basespace upload",
      testMatch: [MNGS_UPLOAD_SPEC_PATH],
      use: {
        ...devices[DESKTOP_CHROME],
        video: VIDEO_CONFIG,
      },
      grep: /mNGS-3: long mNGS Illumina sample Basespace upload/,
    },
    {
      name: "e2e test: mNGS IP: Functional: P-0: mNGS-2: short mNGS Illumina sample Basespace upload",
      testMatch: [MNGS_UPLOAD_SPEC_PATH],
      use: {
        ...devices[DESKTOP_CHROME],
        video: VIDEO_CONFIG,
      },
      grep: /mNGS-2: short mNGS Illumina sample Basespace upload/,
    },
    {
      name: "e2e test: mNGS IP: Functional: P-0: mNGS-1: short mNGS Illumina sample web upload",
      testMatch: [MNGS_UPLOAD_SPEC_PATH],
      use: {
        ...devices[DESKTOP_CHROME],
        video: VIDEO_CONFIG,
      },
      grep: /mNGS-1: short mNGS Illumina sample web upload/,
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
      name: "e2e test: Functional: P-0: Sample upload - SC2 Nanopore Midnight",
      testMatch: [SC2_UPLOAD_SPEC_PATH],
      use: {
        ...devices[DESKTOP_CHROME],
        video: VIDEO_CONFIG,
      },
      grep: /SNo SC2-4: SARS-CoV-2 Nanopore sample web upload/,
    },
    {
      name: "e2e test: Functional: P-0: Sample upload - SC2 Nanopore Clear Labs",
      testMatch: [SC2_UPLOAD_SPEC_PATH],
      use: {
        ...devices[DESKTOP_CHROME],
        video: VIDEO_CONFIG,
      },
      grep: /SNo SC2-3: SARS-CoV-2 Nanopore sample web upload/,
    },
    {
      name: "e2e test: Functional: P-0: Sample upload (web) with wetlab ARTIC v4/ARTIC v4.1",
      testMatch: [SC2_UPLOAD_SPEC_PATH],
      use: {
        ...devices[DESKTOP_CHROME],
        video: VIDEO_CONFIG,
      },
      grep: /SNo SC2-1: SARS-CoV-2 Illumina sample web upload with wetlab ARTIC v4\/ARTIC v4.1/,
    },
    {
      name: "e2e test: Functional: P-0: Sample upload (web) with wetlab ARTIC v5.3.2",
      testMatch: [SC2_UPLOAD_SPEC_PATH],
      use: {
        ...devices[DESKTOP_CHROME],
        video: VIDEO_CONFIG,
      },
      grep: /SNo SC2-1: SARS-CoV-2 Illumina sample web upload with wetlab ARTIC v5.3.2/,
    },
    {
      name: "e2e test: Functional: P-0: Sample upload (web) with wetlab ARTIC v3",
      testMatch: [SC2_UPLOAD_SPEC_PATH],
      use: {
        ...devices[DESKTOP_CHROME],
        video: VIDEO_CONFIG,
      },
      grep: /SNo SC2-1: SARS-CoV-2 Illumina sample web upload with wetlab ARTIC v3$/,
    },
    {
      name: "e2e test: Functional: P-0: Sample upload (web) with wetlab ARTIC v3 - Short Amplicons",
      testMatch: [SC2_UPLOAD_SPEC_PATH],
      use: {
        ...devices[DESKTOP_CHROME],
        video: VIDEO_CONFIG,
      },
      grep: /SNo SC2-1: SARS-CoV-2 Illumina sample web upload with wetlab ARTIC v3 - Short Amplicons/,
    },
    {
      name: "e2e test: Functional: P-0: Sample upload (web) with wetlab MSSPE",
      testMatch: [SC2_UPLOAD_SPEC_PATH],
      use: {
        ...devices[DESKTOP_CHROME],
        video: VIDEO_CONFIG,
      },
      grep: /SNo SC2-1: SARS-CoV-2 Illumina sample web upload with wetlab MSSPE/,
    },
    {
      name: "e2e test: Functional: P-0: Sample upload (web) with wetlab Combined MSSPE & ARTIC v3",
      testMatch: [SC2_UPLOAD_SPEC_PATH],
      use: {
        ...devices[DESKTOP_CHROME],
        video: VIDEO_CONFIG,
      },
      grep: /SNo SC2-1: SARS-CoV-2 Illumina sample web upload with wetlab Combined MSSPE & ARTIC v3/,
    },
    {
      name: "e2e test: Functional: P-0: Sample upload (web) with wetlab SNAP",
      testMatch: [SC2_UPLOAD_SPEC_PATH],
      use: {
        ...devices[DESKTOP_CHROME],
        video: VIDEO_CONFIG,
      },
      grep: /SNo SC2-1: SARS-CoV-2 Illumina sample web upload with wetlab SNAP/,
    },
    {
      name: "e2e test: Functional: P-0: Sample upload (web) with wetlab AmpliSeq",
      testMatch: [SC2_UPLOAD_SPEC_PATH],
      use: {
        ...devices[DESKTOP_CHROME],
        video: VIDEO_CONFIG,
      },
      grep: /SNo SC2-1: SARS-CoV-2 Illumina sample web upload with wetlab AmpliSeq/,
    },
    {
      name: "e2e test: Functional: P-0: Sample upload (web) with wetlab COVIDseq",
      testMatch: [SC2_UPLOAD_SPEC_PATH],
      use: {
        ...devices[DESKTOP_CHROME],
        video: VIDEO_CONFIG,
      },
      grep: /SNo SC2-1: SARS-CoV-2 Illumina sample web upload with wetlab COVIDseq/,
    },
    {
      name: "e2e test: Functional: P-0: Sample upload (web) with wetlab VarSkip",
      testMatch: [SC2_UPLOAD_SPEC_PATH],
      use: {
        ...devices[DESKTOP_CHROME],
        video: VIDEO_CONFIG,
      },
      grep: /SNo SC2-1: SARS-CoV-2 Illumina sample web upload with wetlab VarSkip/,
    },
    {
      name: "e2e test: Functional: P-0: Sample upload (web) with wetlab Midnight",
      testMatch: [SC2_UPLOAD_SPEC_PATH],
      use: {
        ...devices[DESKTOP_CHROME],
        video: VIDEO_CONFIG,
      },
      grep: /SNo SC2-1: SARS-CoV-2 Illumina sample web upload with wetlab Midnight/,
    },
    {
      name: "e2e test: Functional: P-0: Sample upload (web) with wetlab Easyseq",
      testMatch: [SC2_UPLOAD_SPEC_PATH],
      use: {
        ...devices[DESKTOP_CHROME],
        video: VIDEO_CONFIG,
      },
      grep: /SNo SC2-1: SARS-CoV-2 Illumina sample web upload with wetlab Easyseq/,
    },
    {
      name: "e2e test: E2E: P-1: SNo e3: WGS SC2 Nanopore Sample Report & Download Data Validation",
      testMatch: [WGS_SAMPLE_REPORT_SPEC_PATH],
      use: {
        ...devices[DESKTOP_CHROME],
        video: VIDEO_CONFIG,
      },
      grep: /SNo e3:/,
    },
    {
      name: "e2e test: E2E: P-1: SNo e2: WGS SC2 Sample Report & Download Data Validation",
      testMatch: [WGS_SAMPLE_REPORT_SPEC_PATH],
      use: {
        ...devices[DESKTOP_CHROME],
        video: VIDEO_CONFIG,
      },
      grep: /SNo e2:/,
    },
    {
      name: "e2e test: E2E: P-1: SNo e1: WGS Sample Report & Download Data Validation",
      testMatch: [WGS_SAMPLE_REPORT_SPEC_PATH],
      use: {
        ...devices[DESKTOP_CHROME],
        video: VIDEO_CONFIG,
      },
      grep: /SNo e1:/,
    },
    {
      name: "e2e test: Functional: P-0: WGS - Sample upload (web) Basespace project: SNo 5: Basespace Viral Consensus Genome - No trim",
      testMatch: [WGS_SAMPLE_UPLOAD_BASESPACE_SPEC_PATH],
      use: {
        ...devices[DESKTOP_CHROME],
        video: VIDEO_CONFIG,
      },
      grep: /SNo 5:/,
    },
    {
      name: "e2e test: Functional: P-0: WGS - Sample upload (web) Basespace project: SNo 6: Basespace Viral Consensus Genome - with trim",
      testMatch: [WGS_SAMPLE_UPLOAD_BASESPACE_SPEC_PATH],
      use: {
        ...devices[DESKTOP_CHROME],
        video: VIDEO_CONFIG,
      },
      grep: /SNo 6:/,
    },
    {
      name: "e2e test: Functional: P-0: WGS - Sample upload (web) Basespace project: SNo 7: Basespace Viral Consensus Genome - No trim with mNGS - Ilumina",
      testMatch: [WGS_SAMPLE_UPLOAD_BASESPACE_SPEC_PATH],
      use: {
        ...devices[DESKTOP_CHROME],
        video: VIDEO_CONFIG,
      },
      grep: /SNo 7:/,
    },
    {
      name: "e2e test: Functional: P-0: WGS - Sample upload (web) Basespace project: SNo 8: Basespace Viral Consensus Genome - with trim with mNGS - Ilumina",
      testMatch: [WGS_SAMPLE_UPLOAD_BASESPACE_SPEC_PATH],
      use: {
        ...devices[DESKTOP_CHROME],
        video: VIDEO_CONFIG,
      },
      grep: /SNo 8:/,
    },
    {
      name: "e2e test: Functional: P-0: WGS - Sample upload: SNo 1: Viral Consensus Genome - No trim",
      testMatch: [WGS_SAMPLE_UPLOAD_SPEC_PATH],
      use: {
        ...devices[DESKTOP_CHROME],
        video: VIDEO_CONFIG,
      },
      grep: /SNo 1:/,
    },
    {
      name: "e2e test: Functional: P-0: WGS - Sample upload: SNo 2: Viral Consensus Genome - with trim",
      testMatch: [WGS_SAMPLE_UPLOAD_SPEC_PATH],
      use: {
        ...devices[DESKTOP_CHROME],
        video: VIDEO_CONFIG,
      },
      grep: /SNo 2:/,
    },
    {
      name: "e2e test: Functional: P-0: WGS - Sample upload: SNo 3: Viral Consensus Genome - No trim with mNGS - Ilumina",
      testMatch: [WGS_SAMPLE_UPLOAD_SPEC_PATH],
      use: {
        ...devices[DESKTOP_CHROME],
        video: VIDEO_CONFIG,
      },
      grep: /SNo 3:/,
    },
    {
      name: "e2e test: Functional: P-0: WGS - Sample upload: SNo 4: Viral Consensus Genome - with trim with mNGS - Ilumina",
      testMatch: [WGS_SAMPLE_UPLOAD_SPEC_PATH],
      use: {
        ...devices[DESKTOP_CHROME],
        video: VIDEO_CONFIG,
      },
      grep: /SNo 4:/,
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
      testMatch: [SC2_UPLOAD_SPEC_PATH],
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
  },
  workers: 5,
};

export default config;
