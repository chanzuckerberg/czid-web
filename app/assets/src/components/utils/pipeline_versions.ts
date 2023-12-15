export const MASS_NORMALIZED_FEATURE = "MASS_NORMALIZED_FEATURE";
export const ASSEMBLY_FEATURE = "ASSEMBLY_PIPELINE_VERSION";
export const COVERAGE_VIZ_FEATURE = "COVERAGE_VIZ_PIPELINE_VERSION";
export const CONSENSUS_GENOME_FEATURE = "CONSENSUS_GENOME_PIPELINE_VERSION";
export const ACCESSION_COVERAGE_STATS_FEATURE =
  "ACCESSION_COVERAGE_STATS_FEATURE";
export const SHORT_READ_MNGS_MODERN_HOST_FILTERING_FEATURE =
  "SHORT_READ_MNGS_MODERN_HOST_FILTERING_FEATURE";
export const AMR_MODERN_HOST_FILTERING_FEATURE =
  "AMR_MODERN_HOST_FILTERING_FEATURE";
export const AMR_PIPELINE = "AMR_PIPELINE";
export const LONG_READ_MNGS_COV_VIS_WITH_ONE_READ =
  "LONG_READ_COV_VIS_WITHOUT_CONTIG";

export const MINIMUM_VERSIONS = {
  [MASS_NORMALIZED_FEATURE]: "4.0",
  [ASSEMBLY_FEATURE]: "3.1",
  [COVERAGE_VIZ_FEATURE]: "3.6",
  [CONSENSUS_GENOME_FEATURE]: "3.7",
  [ACCESSION_COVERAGE_STATS_FEATURE]: "6.0",
  // Pipeline versions are pinned for projects not using modern host filtering
  [SHORT_READ_MNGS_MODERN_HOST_FILTERING_FEATURE]: "8.0.0",
  [AMR_MODERN_HOST_FILTERING_FEATURE]: "0.3.1",
  [AMR_PIPELINE]: "5",
  [LONG_READ_MNGS_COV_VIS_WITH_ONE_READ]: "0.7.5",
};

/* Compares two strings with required major, minor, and patch versions and
 * an optional alpha or beta tag
 * Fields must be separated by periods or dashes.
 * Test cases:
 * isPipelineVersionAtLeast("1.0.0", "1.0.0") // true
 * isPipelineVersionAtLeast("1.0.0", "1.0.1") // false
 * isPipelineVersionAtLeast("1.2.0", "1.0.0") // true
 * isPipelineVersionAtLeast("1.0.0-beta", "1.0.0") // false
 * isPipelineVersionAtLeast("1.0.0", "1.0.0-beta") // true1
 * isPipelineVersionAtLeast("1.0.0-alpha", "1.0.0-beta") // false
 */
export const isPipelineVersionAtLeast = (
  pipelineVersion: string,
  testVersion: string,
): boolean => {
  if (!pipelineVersion) return false;

  // convert "alpha", "beta", and undefined to numbers along with number strings
  const toInt = (versionPart: string | undefined): number => {
    if (versionPart === "alpha") return -2;
    if (versionPart === "beta") return -1;
    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
    return +versionPart || 0;
  };

  // split on periods or dashes
  const splitRegex = /\.|-/;

  const pipelineParts = pipelineVersion.split(splitRegex);
  const testParts = testVersion.split(splitRegex);

  // compare major version
  if (toInt(pipelineParts[0]) > toInt(testParts[0])) {
    return true;
    /* eslint-disable sonarjs/no-collapsible-if */
  } else if (toInt(pipelineParts[0]) === toInt(testParts[0])) {
    // compare minor version
    if (toInt(pipelineParts[1]) > toInt(testParts[1])) {
      return true;
    } else if (toInt(pipelineParts[1]) === toInt(testParts[1])) {
      // compare patch version
      if (toInt(pipelineParts[2]) >= toInt(testParts[2])) {
        return true;
      } else if (toInt(pipelineParts[2]) === toInt(testParts[2])) {
        // compare alpha/beta version
        if (toInt(pipelineParts[3]) >= toInt(testParts[3])) {
          return true;
        }
      }
    }
  }

  return false;
};

export const isPipelineFeatureAvailable = (
  feature: keyof typeof MINIMUM_VERSIONS,
  pipelineVersion: string,
) => {
  return isPipelineVersionAtLeast(pipelineVersion, MINIMUM_VERSIONS[feature]);
};

// Checks if the AMR workflow run uses the latest CARD DB version (as of 5/23/23)
export const usesLatestCardDbVersion = pipelineVersion => {
  return isPipelineVersionAtLeast(pipelineVersion, "1.2.4");
};

// Checks if gene-level downloads are available for the AMR workflow run
export const isAmrGeneLevelDownloadAvailable = pipelineVersion => {
  return isPipelineVersionAtLeast(pipelineVersion, "1.1.0");
};

// Checks if gene-level contig downloads are available for the AMR workflow run
export const isAmrGeneLevelContigDownloadAvailable = pipelineVersion => {
  return isPipelineVersionAtLeast(pipelineVersion, "1.2.14");
};
