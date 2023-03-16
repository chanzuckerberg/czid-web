import Aioli from "@biowasm/aioli";
import { isEmpty, flatten } from "lodash/fp";
import { nanoid } from "nanoid";
import React, { useEffect, useState } from "react";
import { ANALYTICS_EVENT_NAMES, trackEvent } from "~/api/analytics";
import ExternalLink from "~/components/ui/controls/ExternalLink";
import { SampleFromApi as Sample } from "~/interface/shared";
import IssueGroup from "~ui/notifications/IssueGroup";
import {
  MEGABYTE,
  ILLUMINA,
  NANOPORE,
  R1CHECK,
  R2CHECK,
  INVALID_FASTA_FASTQ,
  MISMATCH_SEQUENCING_PLATFORM,
  TRUNCATED_FILE,
  PAIRED_END_MISMATCHED,
  DUPLICATE_ID,
  NO_VALID_SAMPLES,
  DUPLICATE_ID_ERROR,
  INVALID_FASTA_FASTQ_ERROR,
  TRUNCATED_FILE_ERROR,
  MISMATCH_FILES_ERROR,
  REGEX_READ_ILLUMINA,
  REGEX_READ_NANOPORE,
} from "./constants";
import cs from "./pre_upload_qc_check.scss";

interface PreUploadQCCheckProps {
  samples?: Sample[];
  changeState?: $TSFixMeFunction;
  handleSampleDeselect?: $TSFixMeFunction;
  sequenceTechnology?: string;
}

const PreUploadQCCheck = ({
  samples,
  changeState,
  handleSampleDeselect,
  sequenceTechnology,
}: PreUploadQCCheckProps) => {
  // CLI is used for calling some of the bioinformatics tools for PreUploadQC checks (biowasm, etc...)
  let CLI: $TSFixMe;
  // Set for files that did not pass validateFileType
  const [invalidFiles, setInvalidFiles] = useState<Set<File>>(new Set());
  // Set for files that did not pass validateFASTADuplicates
  const [duplicateIds, setDuplicateIds] = useState<Set<File>>(new Set());
  // Set for files that did not pass validateFASTQNotTruncated
  const [truncatedFiles, setTruncatedFiles] = useState<Set<File>>(new Set());
  // Set for files that did not pass validateFASTQMatchingR1R2
  const [mismatchedFiles, setMismatchedFiles] = useState<Set<File>>(new Set());

  const FASTA_FILE_TYPE = "FASTA";
  const FASTQ_FILE_TYPE = "FASTQ";
  const UNKNOWN_FILE_TYPE = "unknown text";
  const GZ_FILE_TYPE = ".gz";
  const VALID_FASTQ_READ = "@";
  const VALID_FASTA_READ = ">";

  // Add libraries to CLI and mount each file
  const initializeCLI = async () => {
    const pathToAssets = `${location.origin}/assets`;

    CLI = await new Aioli([
      {
        tool: "htslib",
        program: "htsfile",
        version: "1.10",
        urlPrefix: pathToAssets,
      },
      { tool: "seqtk", version: "1.3", urlPrefix: pathToAssets },
    ]);

    // For each sample, extract all the files the user wants to upload, and mount them
    const files = flatten(samples.map(s => Object.values(s.files)));
    await CLI.mount(files);
  };

  // Wrapper function to run all functions
  const wrapper = async () => {
    handleSamplesRemove();
    await initializeCLI();
    runAllValidationChecks();
  };

  // Removes files from each set that are no longer in samples
  const handleSamplesRemove = () => {
    setInvalidFiles(
      () =>
        new Set(
          [...invalidFiles].filter(object1 => {
            return samples.some(object2 => {
              return object1.name in object2.files;
            });
          }),
        ),
    );

    setDuplicateIds(
      () =>
        new Set(
          [...duplicateIds].filter(object1 => {
            return samples.some(object2 => {
              return object1.name in object2.files;
            });
          }),
        ),
    );

    setTruncatedFiles(
      () =>
        new Set(
          [...truncatedFiles].filter(object1 => {
            return samples.some(object2 => {
              return object1.name in object2.files;
            });
          }),
        ),
    );

    setMismatchedFiles(
      () =>
        new Set(
          [...mismatchedFiles].filter(object1 => {
            return samples.some(object2 => {
              return object1.name in object2.files;
            });
          }),
        ),
    );
  };

  // Validate that the file is FASTA or FASTQ
  const validateFileType = async (file: File) => {
    try {
      // Will return either "FASTA text", "FASTQ sequence text", or "unknown text"
      const fileType = await CLI.exec(`htsfile ${file.name}`);

      // If htsfile doens't recognize it, it's a not a valid FASTA/FASTQ
      if (fileType.includes(UNKNOWN_FILE_TYPE) && !invalidFiles.has(file)) {
        setInvalidFiles(arr => new Set([...arr, file]));
        trackEvent(ANALYTICS_EVENT_NAMES.PRE_UPLOAD_QC_CHECK_WARNING_TYPE, {
          error: INVALID_FASTA_FASTQ,
        });
        return false;
      }

      return fileType;
    } catch (e) {
      return false;
    }
  };

  // Validate that the FASTA file has no duplicate sequences
  const validateFASTADuplicates = async (file: File) => {
    try {
      // Get first 1MB of FASTA (we go through seqtk for this for .gz support)
      const fileSlice = await sliceFile(file, 0, MEGABYTE);
      const fastaContents = await CLI.exec(`seqtk seq -l0 ${fileSlice.name}`);

      // Check for duplicate FASTA IDs
      const readIds = fastaContents
        .split("\n")
        .filter(line => line.startsWith(">"));
      const readIdsUnique = new Set(readIds);
      if (readIds.length !== readIdsUnique.size) {
        setDuplicateIds(dup => new Set([...dup, file]));
        trackEvent(ANALYTICS_EVENT_NAMES.PRE_UPLOAD_QC_CHECK_WARNING_TYPE, {
          error: DUPLICATE_ID,
        });
        return false;
      }
    } catch (e) {
      return false;
    }
    return true;
  };

  // Validate that the FASTQ file is not truncated
  const validateFASTQNotTruncated = async (file: File) => {
    // Don't check for truncation for .gz files. This is because we can't
    // parse the end of a .gz file without first reading the whole file!
    if (file.name.includes(GZ_FILE_TYPE)) return true;

    try {
      // Get the last megabyte of the file
      const byteStart = Math.max(0, file.size - MEGABYTE);
      const fastqContents = await sliceFile(file, byteStart, file.size);

      // Extract the last four lines, i.e. last FASTQ record of the file
      const fileContents = await fastqContents.text();
      const last4Lines = fileContents
        .trim()
        .split("\n")
        .slice(-4)
        .join("\n");
      const fileLast4Lines = new File(
        [last4Lines],
        `${file.name}.${nanoid()}.last4`,
      );
      await CLI.mount(fileLast4Lines);

      // Run seqtk on the file containing just the last FASTQ record
      // We can detect various scenarios based on the output of seqtk:
      // - ""  seqtk did not detect a valid FASTA or FASTQ sequence in the last 4 lines
      // - "@"  seqtk detected a valid FASTQ read (FASTQ read names start with @)
      // - ">" seqtk detected a valid FASTA record (FASTA sequence names start with >)
      const lastRecord = await CLI.exec(`seqtk seq ${fileLast4Lines.name}`);
      if (
        (lastRecord[0] !== VALID_FASTQ_READ ||
          isEmpty(lastRecord) ||
          lastRecord[0] === VALID_FASTA_READ) &&
        !truncatedFiles.has(file)
      ) {
        setTruncatedFiles(arr => new Set([...arr, file]));
        trackEvent(ANALYTICS_EVENT_NAMES.PRE_UPLOAD_QC_CHECK_WARNING_TYPE, {
          error: TRUNCATED_FILE,
        });
        return false;
      }
    } catch (e) {
      return false;
    }
    return true;
  };

  // Validate that the FASTQ read names match Illumina or Nanopore
  const validateFASTQReads = async (file: File) => {
    try {
      // Get first 1MB of FASTQ (we go through seqtk for this for .gz support)
      const fileSlice = await sliceFile(file, 0, MEGABYTE);
      const fastqContents = await CLI.exec(`seqtk seq ${fileSlice.name}`);
      const fastqReadNames = fastqContents
        .split("\n")
        .filter(line => line.startsWith("@"));

      // Check whether read names are Illumina or Nanopore
      const isIllumina = fastqReadNames.every(d => REGEX_READ_ILLUMINA.test(d));
      if (isIllumina) return ILLUMINA;
      const isNanopore = fastqReadNames.every(d => REGEX_READ_NANOPORE.test(d));
      if (isNanopore) return NANOPORE;
    } catch (e) {
      return false;
    }
    return false;
  };

  // Validate if R1 and R2 files are paired-end mismatched
  const validateFASTQMatchingR1R2 = async (fileR1: File, fileR2: File) => {
    try {
      // Preprocessing to make sure the fileR1 includes R1 and fileR2 includes R2
      if (fileR1.name.includes(R2CHECK)) {
        const temp = fileR1;
        fileR1 = fileR2;
        fileR2 = temp;
      }

      // Get first 1MB of R1/R2 FASTQs (we go through seqtk for this for .gz support)
      const fileSliceR1 = await sliceFile(fileR1, 0, MEGABYTE);
      const fileSliceR2 = await sliceFile(fileR2, 0, MEGABYTE);
      const fastqContentsR1 = await CLI.exec(`seqtk seq ${fileSliceR1.name}`);
      const fastqContentsR2 = await CLI.exec(`seqtk seq ${fileSliceR2.name}`);
      const fastqReadNamesR1 = fastqContentsR1
        .split("\n")
        .filter(line => line.startsWith("@"));
      const fastqReadNamesR2 = fastqContentsR2
        .split("\n")
        .filter(line => line.startsWith("@"));

      // Iterate through read names until find a mismatch
      for (let i = 0; i < fastqReadNamesR1.length; i++) {
        const isPaired =
          findDiff(fastqReadNamesR1[i], fastqReadNamesR2[i]) === "2";
        if (!isPaired) {
          setMismatchedFiles(arr => new Set([...arr, fileR1, fileR2]));
          trackEvent(ANALYTICS_EVENT_NAMES.PRE_UPLOAD_QC_CHECK_WARNING_TYPE, {
            error: PAIRED_END_MISMATCHED,
          });
          return false;
        }
      }
      return true;
    } catch (e) {
      return false;
    }
  };

  // Validate if all samples are invalid, also handles analytics for mismatch sequence check
  const validateAllSamplesAreInvalid = () => {
    if (samples.every(element => element.finishedValidating === true)) {
      let result = true;
      samples.forEach(element => {
        if (element.isValid) {
          // File is FASTA or FASTQ file does not have format
          if (!element.format) result = false;
          // Illumina Technology is selected and format is illumina
          else if (
            sequenceTechnology === ILLUMINA &&
            element.format === ILLUMINA
          ) {
            result = false;
            trackEvent(ANALYTICS_EVENT_NAMES.PRE_UPLOAD_QC_CHECK_WARNING_TYPE, {
              error: MISMATCH_SEQUENCING_PLATFORM,
            });
          }
          // Nanopore is selected and format is nanopore
          else if (
            sequenceTechnology === NANOPORE &&
            element.format === NANOPORE
          ) {
            result = false;
            trackEvent(ANALYTICS_EVENT_NAMES.PRE_UPLOAD_QC_CHECK_WARNING_TYPE, {
              error: MISMATCH_SEQUENCING_PLATFORM,
            });
          }
          // Illumina or nanopore is not selected
          else if (
            sequenceTechnology !== ILLUMINA &&
            sequenceTechnology !== NANOPORE
          )
            result = false;
        }
      });
      if (result) {
        trackEvent(ANALYTICS_EVENT_NAMES.PRE_UPLOAD_QC_CHECK_WARNING_TYPE, {
          error: NO_VALID_SAMPLES,
        });
      }
      return result;
    }
  };

  // Find difference between string, returns characters that are in str2 that are not in str1
  const findDiff = (str1: string, str2: string) => {
    let diff = "";
    str2.split("").forEach((val, i) => {
      if (val !== str1.charAt(i)) diff += val;
    });
    return diff;
  };

  // Slice a File object, create a new File, and mount it on to filesystem
  const sliceFile = async (file: File, start: number, end: number) => {
    // Take a slice of the file and make it into a new file
    const blob = file.slice(start, end);
    const fileSlice = new File([blob], `${file.name}.${nanoid()}.slice`);

    // Mount it so you can run CLI commands on the file
    await CLI.mount(fileSlice);
    return fileSlice;
  };

  // Run each validation check for each file
  const runAllValidationChecks = async () => {
    let cumulativeInvalidFileSizes = 0;

    for (const sample of samples) {
      // Skip validation if already done on this sample
      if (sample.finishedValidating === true) {
        if (!sample.isValid) {
          Object.values(sample.files).forEach(
            f => (cumulativeInvalidFileSizes += f.size),
          );
        }
        handleCheckbox(sample);
        continue;
      }

      // Assume sample is valid unless proven otherwise
      let sampleIsValid = true;
      for (const fileName in sample.files) {
        const file = sample.files[fileName];

        // 1. Valid FASTA or FASTQ file?
        const fileType = await validateFileType(file);
        if (fileType === false) {
          sampleIsValid = false;
          sample.error = INVALID_FASTA_FASTQ_ERROR;
          break;
        } else if (fileType.includes(FASTA_FILE_TYPE)) {
          // ------–------–------–------–--------
          // FASTA File Validations
          // ------–------–------–------–--------
          // 2. Duplicate IDs in FASTA?
          const isValidFASTA = await validateFASTADuplicates(file);
          if (!isValidFASTA) {
            sampleIsValid = false;
            sample.error = DUPLICATE_ID_ERROR;
          }
        } else if (fileType.includes(FASTQ_FILE_TYPE)) {
          // ------–------–------–------–--------
          // FASTQ File Validations
          // ------–------–------–------–--------
          // 3. Truncated FASTQ file?
          const isValid = await validateFASTQNotTruncated(file);
          if (!isValid) {
            sampleIsValid = false;
            sample.error = TRUNCATED_FILE_ERROR;
          }

          // 4. Validate FASTQ read names for Illumina/Nanopore
          const technologyType = await validateFASTQReads(file);
          if (technologyType) sample.format = technologyType;

          // 5. Check to see if FASTQ file has matching R1/R2 file
          if (fileName.includes(R1CHECK) || fileName.includes(R2CHECK)) {
            const pairedEndSample = fileName.includes(R1CHECK)
              ? fileName.replace(R1CHECK, R2CHECK)
              : fileName.replace(R2CHECK, R1CHECK);
            if (fileName in sample.files && pairedEndSample in sample.files) {
              const isMatched = await validateFASTQMatchingR1R2(
                file,
                sample.files[pairedEndSample],
              );
              if (!isMatched) {
                sampleIsValid = false;
                sample.error = MISMATCH_FILES_ERROR;
              }
            }
          }
        }
      }
      sample.finishedValidating = true;
      sample.isValid = sampleIsValid;
      if (!sampleIsValid) {
        Object.values(sample.files).forEach(
          f => (cumulativeInvalidFileSizes += f.size),
        );
      }
      changeState(samples);
      handleCheckbox(sample);
    }
    // If the files encountered errors, track the cumulative size of the failed file(s).
    if (cumulativeInvalidFileSizes > 0) {
      trackEvent(
        ANALYTICS_EVENT_NAMES.PRE_UPLOAD_QC_CHECK_CUMULATIVE_FILE_SIZE_FAILED,
        {
          cumulativeInvalidFileSizes,
        },
      );
    }
  };

  // Delete samples from selected IDs if file is invalid
  const handleCheckbox = (sample: Sample) => {
    if (!sample.isValid) {
      handleSampleDeselect(sample._selectId, false, "local");
    } else if (sample.format) {
      if (sample.format === ILLUMINA)
        handleSampleDeselect(
          sample._selectId,
          sample.format === ILLUMINA && sequenceTechnology !== NANOPORE,
          "local",
        );
      else if (sample.format === NANOPORE)
        handleSampleDeselect(
          sample._selectId,
          sample.format === NANOPORE && sequenceTechnology !== ILLUMINA,
          "local",
        );
    }
  };

  // Get all files of the given sequence technology
  const getFiles = (sequenceTechnologyType: string) => {
    const allFiles: $TSFixMe = [];
    const filteredArrayOfSequenceTechnolgy = samples.filter(
      element => element.format === sequenceTechnologyType,
    );

    filteredArrayOfSequenceTechnolgy.forEach(element => {
      for (const key in element.files) allFiles.push(key);
    });
    return allFiles;
  };

  // Rerenders whenever samples, or sequence technology changes
  useEffect(() => {
    wrapper();
  }, [samples, sequenceTechnology]);

  // Adds every file into array
  const addAllFilesIntoArray = () => {
    const allFiles: File[] = [];
    samples.forEach(element =>
      Object.values(element.files).forEach(val => allFiles.push(val)),
    );
    return allFiles;
  };

  // Returns a list of filenames for files with mismatched paired ends,
  // with the paired files grouped together.
  // For example: [[sample1_R1, sample1_R2], [sample2_R1, sample2_R2], ...]
  // Used for displaying the errored files in two separate columns in the warning callout.
  const pairMismatchedFileNames = () => {
    const pairedFiles = new Set();
    const fileNames: $TSFixMe = [];
    mismatchedFiles.forEach(file => {
      const fileName = file.name;
      if (!pairedFiles.has(fileName)) {
        if (fileName.includes(R1CHECK)) {
          fileNames.push([fileName, fileName.replace(R1CHECK, R2CHECK)]);
          pairedFiles.add(fileName);
          pairedFiles.add(fileName.replace(R1CHECK, R2CHECK));
        } else if (fileName.includes(R2CHECK)) {
          fileNames.push([fileName.replace(R2CHECK, R1CHECK), fileName]);
          pairedFiles.add(fileName);
          pairedFiles.add(fileName.replace(R2CHECK, R1CHECK));
        }
      }
    });
    return fileNames;
  };

  return (
    <div className={cs.warning}>
      <div>
        {invalidFiles.size > 0 && (
          <IssueGroup
            className={cs.issue}
            caption={`${invalidFiles.size} file${
              invalidFiles.size > 1 ? "s" : ""
            } 
            won't be uploaded because they are not a supported format. Please make sure your files are either FASTA or FASTQ.`}
            headers={["File Name"]}
            rows={[...invalidFiles].map(name => [name])}
            type="warning"
          />
        )}
        {duplicateIds.size > 0 && (
          <IssueGroup
            className={cs.issue}
            caption={
              <span>
                {duplicateIds.size + " file"}
                {duplicateIds.size > 1 ? "s " : " "}
                will not be uploaded because there are duplicate read IDs. Tip!
                You can use the SeqKit method &quot;rename&quot; on the
                duplicate read IDs in your FASTA file to make them unique. Check
                out SeqKit documentation{" "}
                <ExternalLink
                  coloredBackground={true}
                  href="https://bioinf.shenwei.me/seqkit/usage/#rename"
                >
                  {"here"}
                </ExternalLink>
                .
              </span>
            }
            headers={["File Name"]}
            rows={[...duplicateIds].map(name => [name])}
            type="warning"
          />
        )}
        {truncatedFiles.size > 0 && (
          <IssueGroup
            className={cs.issue}
            caption={`${truncatedFiles.size} file${
              truncatedFiles.size > 1 ? "s" : ""
            } 
            won't be uploaded because they appear to be truncated. If you subsampled your FASTQ file, make sure to do so using a number of lines that is a multiple of 4, since each read in a FASTQ file takes up 4 lines.`}
            headers={["File Name"]}
            rows={[...truncatedFiles].map(name => [name])}
            type="warning"
          />
        )}
        {mismatchedFiles.size > 0 && (
          <IssueGroup
            className={cs.issue}
            caption={
              <span>
                {mismatchedFiles.size + " file"}
                {mismatchedFiles.size > 1 ? "s " : " "}
                will not be uploaded because the paired-end files do not match.
                Tip! You can use use the SeqKit method named &quot;pair&quot; to
                sort your FASTQ files so that R1 and R2 reads match up. Check
                out SeqKit documentation{" "}
                <ExternalLink
                  coloredBackground={true}
                  href="https://bioinf.shenwei.me/seqkit/usage/#pair"
                >
                  {"here"}
                </ExternalLink>
                .
              </span>
            }
            headers={["R1 File Name", "R2 File Name"]}
            rows={pairMismatchedFileNames()}
            type="warning"
          />
        )}
        {sequenceTechnology === ILLUMINA &&
          samples.some(element => element.format === NANOPORE) && (
            <IssueGroup
              className={cs.issue}
              caption={`${getFiles(NANOPORE).length} 
              file${getFiles(NANOPORE).length > 1 ? "s" : ""} 
              will not be uploaded. You selected Illumina as the sequencing platform, but the 
              file${getFiles(NANOPORE).length > 1 ? "s do" : " does"} 
              not appear to be an Illumina output.`}
              headers={["File Name"]}
              rows={getFiles(NANOPORE).map(name => [name])}
              type="warning"
            />
          )}
        {sequenceTechnology === NANOPORE &&
          samples.some(element => element.format === ILLUMINA) && (
            <IssueGroup
              className={cs.issue}
              caption={`${getFiles(ILLUMINA).length} file${
                getFiles(ILLUMINA).length > 1 ? "s" : ""
              } 
              will not be uploaded. You selected Nanopore as the sequencing platform, but the file${
                getFiles(ILLUMINA).length > 1 ? "s do" : " does"
              } 
              not appear to be a Nanopore output.`}
              headers={["File Name"]}
              rows={getFiles(ILLUMINA).map(name => [name])}
              type="warning"
            />
          )}
        {validateAllSamplesAreInvalid() && (
          <IssueGroup
            caption={`There are no valid samples available for upload. Please fix the errors or select more files. If needed, contact us at help@czid.org for assistance.`}
            headers={["File Name"]}
            rows={addAllFilesIntoArray().map(name => [name.name])}
            type="error"
          />
        )}
      </div>
    </div>
  );
};

export default PreUploadQCCheck;
