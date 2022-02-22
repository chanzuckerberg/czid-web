import { isEmpty, last } from "lodash/fp";

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

export const sampleErrorInfo = ({ sample, pipelineRun = {}, error = {} }) => {
  let status, message, linkText, type, link, pipelineVersionUrlParam;
  switch (
    sample.upload_error ||
    (pipelineRun && pipelineRun.known_user_error) ||
    error.label
  ) {
    // For samples run using SFN, error messages are sent from the server;
    // this function just sets the status, error type, and followup link
    // for frontend display.
    case "InvalidInputFileError":
      status = "COMPLETE - ISSUE";
      message = pipelineRun.error_message || error.message;
      linkText = "Please check your file format and reupload your file.";
      type = "warning";
      link = "/samples/upload";
      break;
    case "InvalidFileFormatError":
      status = "COMPLETE - ISSUE";
      message = pipelineRun.error_message || error.message;
      linkText = "Please check your file format and reupload your file.";
      type = "warning";
      link = "/samples/upload";
      break;
    case "InsufficientReadsError":
      status = "COMPLETE - ISSUE";
      message = pipelineRun.error_message || error.message;
      linkText = isEmpty(pipelineRun)
        ? "Contact us for help."
        : "Check where your reads were filtered out.";
      type = "warning";
      pipelineVersionUrlParam =
        pipelineRun && pipelineRun.pipeline_version
          ? `?pipeline_version=${pipelineRun.pipeline_version}`
          : "";
      link = isEmpty(pipelineRun)
        ? "mailto:help@czid.org"
        : `/samples/${sample.id}/results_folder${pipelineVersionUrlParam}`;
      break;
    case "BrokenReadPairError":
      status = "COMPLETE - ISSUE";
      message = pipelineRun.error_message || error.message;
      linkText = "Please fix the read pairing, then reupload.";
      type = "warning";
      link = "/samples/upload";
      break;
    // The following cases are for older samples that do not have the error messages
    // sent from the server.
    case "BASESPACE_UPLOAD_FAILED":
      status = "SAMPLE FAILED";
      message =
        "Oh no! There was an issue uploading your sample file from Basespace.";
      linkText = "Contact us for help.";
      type = "error";
      link = "mailto:help@czid.org";
      break;
    case "S3_UPLOAD_FAILED":
      status = "SAMPLE FAILED";
      message = "Oh no! There was an issue uploading your sample file from S3.";
      linkText = "Contact us for help.";
      type = "error";
      link = "mailto:help@czid.org";
      break;
    case "LOCAL_UPLOAD_FAILED":
      status = "SAMPLE FAILED";
      message = "Oh no! It took too long to upload your sample file.";
      linkText = "Contact us for help.";
      type = "error";
      link = "mailto:help@czid.org";
      break;
    case "LOCAL_UPLOAD_STALLED":
      status = "INCOMPLETE - ISSUE";
      message =
        "It looks like it is taking a long time to upload your sample file.";
      linkText = "Contact us for help.";
      type = "warning";
      link = "mailto:help@czid.org";
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
        pipelineRun ? pipelineRun.error_message : ""
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
      linkText = "Please fix the read pairing, then reupload.";
      type = "warning";
      link = "/samples/upload";
      break;
    default:
      status = "SAMPLE FAILED";
      message = "Oh no! There was an issue processing your sample.";
      linkText = "Contact us for help re-running your sample.";
      type = "error";
      link = "mailto:help@czid.org";
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
