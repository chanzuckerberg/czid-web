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

export const sampleErrorInfo = (sample, pipelineRun) => {
  let status, message, linkText, type, link, pipelineVersionUrlParam;
  switch (
    sample.upload_error || (pipelineRun && pipelineRun.known_user_error)
  ) {
    case "BASESPACE_UPLOAD_FAILED":
      status = "SAMPLE FAILED";
      message =
        "Oh no! There was an issue uploading your sample file from Basespace.";
      linkText = "Contact us for help.";
      type = "error";
      link = "mailto:help@idseq.net";
      break;
    case "S3_UPLOAD_FAILED":
      status = "SAMPLE FAILED";
      message = "Oh no! There was an issue uploading your sample file from S3.";
      linkText = "Contact us for help.";
      type = "error";
      link = "mailto:help@idseq.net";
      break;
    case "LOCAL_UPLOAD_FAILED":
      status = "SAMPLE FAILED";
      message = "Oh no! It took too long to upload your sample file.";
      linkText = "Contact us for help.";
      type = "error";
      link = "mailto:help@idseq.net";
      break;
    case "LOCAL_UPLOAD_STALLED":
      status = "INCOMPLETE - ISSUE";
      message =
        "It looks like it is taking a long time to upload your sample file.";
      linkText = "Contact us for help.";
      type = "warning";
      link = "mailto:help@idseq.net";
      break;
    case "DO_NOT_PROCESS":
      status = "PROCESSING SKIPPED";
      message =
        "Sample processing has been skipped due to user selection during upload.";
      type = "info";
      break;
    case "FAULTY_INPUT":
      status = "COMPLETE - ISSUE";
      message = `Sorry, something was wrong with your input file. ${
        pipelineRun.error_message
      }.`;
      linkText = "Please check your file format and reupload your file.";
      type = "warning";
      link = "/samples/upload";
      break;
    case "INSUFFICIENT_READS":
      status = "COMPLETE - ISSUE";
      message =
        "Oh no! No matches were identified because there weren't any reads left after host and quality filtering.";
      linkText = "Check where your reads were filtered out.";
      type = "warning";
      pipelineVersionUrlParam =
        pipelineRun && pipelineRun.pipeline_version
          ? `?pipeline_version=${pipelineRun.pipeline_version}`
          : "";
      link = `/samples/${sample.id}/results_folder${pipelineVersionUrlParam}`;
      break;
    case "BROKEN_PAIRS":
      status = "COMPLETE - ISSUE";
      message =
        "Sorry, something was wrong with your input files. " +
        "Either the paired reads were not named using the same identifiers in both files, " +
        "or some reads were missing a mate.";
      linkText = "Please fix the read pairing, then reupload";
      type = "warning";
      link = "/samples/upload";
      break;
    default:
      status = "SAMPLE FAILED";
      message = "Oh no! There was an issue processing your sample.";
      linkText = "Contact us for help re-running your sample.";
      type = "error";
      link = "mailto:help@idseq.net";
      break;
  }

  return {
    status: status,
    message: message,
    type: type,
    linkText: linkText,
    link: link,
  };
};
