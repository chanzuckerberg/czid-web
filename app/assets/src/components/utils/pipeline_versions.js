export const MASS_NORMALIZED_FEATURE = "MASS_NORMALIZED_FEATURE";
export const ASSEMBLY_FEATURE = "ASSEMBLY_PIPELINE_VERSION";
export const COVERAGE_VIZ_FEATURE = "COVERAGE_VIZ_PIPELINE_VERSION";
export const CONSENSUS_GENOME_FEATURE = "CONSENSUS_GENOME_PIPELINE_VERSION";
export const ACCESSION_COVERAGE_STATS_FEATURE =
  "ACCESSION_COVERAGE_STATS_FEATURE";

export const MINIMUM_VERSIONS = {
  [MASS_NORMALIZED_FEATURE]: "4.0",
  [ASSEMBLY_FEATURE]: "3.1",
  [COVERAGE_VIZ_FEATURE]: "3.6",
  [CONSENSUS_GENOME_FEATURE]: "3.7",
  [ACCESSION_COVERAGE_STATS_FEATURE]: "6.0",
};

const pipelineVersionAtLeast = (pipelineVersion, testVersion) => {
  if (!pipelineVersion) return false;

  // turn undefined to 0.
  const toInt = versionNumber => +versionNumber || 0;

  const pipelineNums = pipelineVersion.split(".");
  const testNums = testVersion.split(".");

  if (toInt(pipelineNums[0]) > toInt(testNums[0])) {
    return true;
  } else if (toInt(pipelineNums[0]) === toInt(testNums[0])) {
    if (toInt(pipelineNums[1]) > toInt(testNums[1])) {
      return true;
    } else if (toInt(pipelineNums[1]) === toInt(testNums[1])) {
      if (toInt(pipelineNums[2]) >= toInt(testNums[2])) {
        return true;
      }
    }
  }

  return false;
};

export const isPipelineFeatureAvailable = (feature, pipelineVersion) => {
  return pipelineVersionAtLeast(pipelineVersion, MINIMUM_VERSIONS[feature]);
};
