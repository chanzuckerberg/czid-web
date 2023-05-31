import { isEmpty, last } from "lodash/fp";
import Sample, { SampleStatus } from "~/interface/sample";
import { PipelineRun } from "../../interface/shared/specific";

// Get the basename from a file path
export const baseName = (str: string) => {
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

export const cleanFilePath = (name: string) => {
  name = name.trim();

  // Remove ./ and .\ from the start of file paths
  return name.replace(/^\.[\\|/]/, "");
};

export const sampleNameFromFileName = (fname: string) => {
  let base = baseName(fname);
  const fastqLabel = /.fastq*$|.fq*$|.fasta*$|.fa*$|.gz*$/gim;
  const readLabel = /_R1.*$|_R2.*$/gi;
  base = base.replace(fastqLabel, "").replace(readLabel, "");
  return base;
};

const errorMap = {
  "The .fastq file.+has an invalid number of lines.":
    "Please verify the number of lines in the file is divisible by 4.",
  "The maximum line length was exceeded.+":
    "Please verify that .fastq headers or sequences are less than 10,000 characters long",
  "There was an error unzipping the input file.+":
    "Please verify that this file is a proper .gz file.",
  "Paired input files.+":
    "Paired input files must contain the same number of reads.",
  "The input file.+is invalid.":
    "Please check that your .fastq file is valid and try again.",
  'The input .fastq file.+did not begin with an "@"':
    "Please check the .fastq file and try again.",
  'The input .fasta file.+read ID did not begin with a ">"':
    "Please check the .fasta file and try again.",
  "The input file.+ has duplicate read IDs":
    "Please remove duplicate read ids and try again",
  "There was an insufficient number of reads .+":
    "Please verify the sequencing quality of this sample.",
  "The file.+contain reads longer than the 500 bp limit for the Illumina-supported pipeline":
    "Please verify the sequencing platform during sample upload.",
  "The CZ ID pipeline expects a single input file.+":
    "Please check your input file and try again.",
  "There was an error parsing the input file.+":
    "Please check that the file is not corrupted and is in the .fastq format.",
  "The file.+is in .fasta format.+": "Please upload a .fastq file.",
};

function subtextError(message: string) {
  for (const [key, value] of Object.entries(errorMap)) {
    if (message.match(key)) {
      return value;
    }
  }
}

// String constants
const UPLOAD_URL = "/samples/upload";
const MAILTO_LINK = "mailto:help@czid.org";
const CONTACT_US = "Contact us for help.";

export const sampleErrorInfo = ({
  sample,
  pipelineRun = {},
  error = {},
}: {
  sample: Sample;
  pipelineRun: PipelineRun | Record<string, never>;
  error?: { label?: string; message: string } | Record<string, never>;
}) => {
  let status: SampleStatus,
    message,
    subtitle,
    linkText,
    type,
    link,
    pipelineVersionUrlParam;
  switch (
    sample.upload_error ||
    (pipelineRun && pipelineRun.known_user_error) ||
    error.label
  ) {
    // For samples run using SFN, error messages are sent from the server;
    // this function just sets the status, error type, and followup link
    // for frontend display.
    case "InvalidFileFormatError":
    case "InvalidInputFileError":
      status = SampleStatus.INCOMPLETE_ISSUE;
      message = pipelineRun.error_message || error.message;
      subtitle = subtextError(message);
      linkText = subtitle
        ? ""
        : "Please check your file format and reupload your file.";
      type = "warning";
      link = UPLOAD_URL;
      break;
    case "InsufficientReadsError":
      status = SampleStatus.COMPLETE_ISSUE;
      message = pipelineRun.error_message || error.message;
      subtitle = subtextError(message);
      linkText = isEmpty(pipelineRun)
        ? CONTACT_US
        : "Check where your reads were filtered out.";
      type = "warning";
      pipelineVersionUrlParam =
        pipelineRun && pipelineRun.pipeline_version
          ? `?pipeline_version=${pipelineRun.pipeline_version}`
          : "";
      link = isEmpty(pipelineRun)
        ? MAILTO_LINK
        : `/samples/${sample.id}/results_folder${pipelineVersionUrlParam}`;
      break;
    case "BrokenReadPairError":
      status = SampleStatus.COMPLETE_ISSUE;
      message = pipelineRun.error_message || error.message;
      linkText = "Please fix the read pairing, then reupload.";
      type = "warning";
      link = UPLOAD_URL;
      break;
    // The following cases are for older samples that do not have the error messages
    // sent from the server.
    case "BASESPACE_UPLOAD_FAILED":
      status = SampleStatus.SAMPLE_FAILED;
      message =
        "Oh no! There was an issue uploading your sample file from Basespace.";
      linkText = CONTACT_US;
      type = "error";
      link = MAILTO_LINK;
      break;
    case "S3_UPLOAD_FAILED":
      status = SampleStatus.SAMPLE_FAILED;
      message = "Oh no! There was an issue uploading your sample file from S3.";
      linkText = CONTACT_US;
      type = "error";
      link = MAILTO_LINK;
      break;
    case "LOCAL_UPLOAD_FAILED":
      status = SampleStatus.SAMPLE_FAILED;
      message = "Oh no! It took too long to upload your sample file.";
      linkText = CONTACT_US;
      type = "error";
      link = MAILTO_LINK;
      break;
    case "LOCAL_UPLOAD_STALLED":
      status = SampleStatus.INCOMPLETE_ISSUE;
      message =
        "It looks like it is taking a long time to upload your sample file.";
      linkText = CONTACT_US;
      type = "warning";
      link = MAILTO_LINK;
      break;
    case "DO_NOT_PROCESS":
      status = SampleStatus.PROCESSING_SKIPPED;
      message =
        "Sample processing has been skipped due to user selection during upload.";
      type = "info";
      break;
    case "FAULTY_INPUT":
      status = SampleStatus.COMPLETE_ISSUE;
      message = `Sorry, something was wrong with your input file. ${
        pipelineRun ? pipelineRun.error_message : ""
      }.`;
      linkText = "Please check your file format and reupload your file.";
      type = "warning";
      link = UPLOAD_URL;
      break;
    case "INSUFFICIENT_READS":
      status = SampleStatus.COMPLETE_ISSUE;
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
      status = SampleStatus.COMPLETE_ISSUE;
      message =
        "Sorry, something was wrong with your input files. " +
        "Either the paired reads were not named using the same identifiers in both files, " +
        "or some reads were missing a mate.";
      linkText = "Please fix the read pairing, then reupload.";
      type = "warning";
      link = UPLOAD_URL;
      break;
    default:
      status = SampleStatus.SAMPLE_FAILED;
      message = "Oh no! There was an issue processing your sample.";
      linkText = "Contact us for help re-running your sample.";
      type = "error";
      link = MAILTO_LINK;
      break;
  }

  return {
    status: status,
    message: message,
    subtitle: subtitle,
    type: type,
    linkText: linkText,
    link: link,
  };
};
