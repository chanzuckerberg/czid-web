import { last } from "lodash/fp";

export const pipelineVersionHasAssembly = pipelineVersion => {
  if (!pipelineVersion) return false;
  const versionNums = pipelineVersion.split(".");
  return (
    +versionNums[0] >= 4 || (+versionNums[0] === 3 && +versionNums[1] >= 1)
  );
};

export const pipelineVersionHasCoverageViz = pipelineVersion => {
  if (!pipelineVersion) return false;
  const versionNums = pipelineVersion.split(".");
  return (
    +versionNums[0] >= 4 || (+versionNums[0] === 3 && +versionNums[1] >= 6)
  );
};

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
