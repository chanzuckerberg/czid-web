import { last } from "lodash/fp";

export const pipelineVersionAtLeast = (pipelineVersion, testVersion) => {
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

const ASSEMBLY_PIPELINE_VERSION = "3.1";
const COVERAGE_VIZ_PIPELINE_VERSION = "3.6";

export const pipelineVersionHasAssembly = pipelineVersion =>
  pipelineVersionAtLeast(pipelineVersion, ASSEMBLY_PIPELINE_VERSION);

export const pipelineVersionHasCoverageViz = pipelineVersion =>
  pipelineVersionAtLeast(pipelineVersion, COVERAGE_VIZ_PIPELINE_VERSION);

// Get the basename from a file path
export const baseName = str => {
  let base = cleanFilePath(str);

  let separator = "/";
  if (base.includes("\\")) {
    // If the name includes the backslash \ it's probably from Windows.
    separator = "\\";
  }

  // Get the last piece
  base = last(base.split(separator));

  if (base.includes(".")) {
    // Leave off the extension
    base = base.substring(0, base.lastIndexOf("."));
  }
  return base;
};

export const cleanFilePath = name => {
  name = name.trim();

  // Remove ./ and .\ from the start of file paths
  return name.replace(/^\.[\\|/]/, "");
};

export const sampleNameFromFileName = fname => {
  let base = baseName(fname);
  const fastqLabel = /.fastq*$|.fq*$|.fasta*$|.fa*$|.gz*$/gim;
  const readLabel = /_R1.*$|_R2.*$/gi;
  base = base.replace(fastqLabel, "").replace(readLabel, "");
  return base;
};

export const joinServerError = response => {
  let joined = "";
  Object.keys(response).forEach(group => {
    joined += response[group].join(". ");
  });
  return joined;
};
