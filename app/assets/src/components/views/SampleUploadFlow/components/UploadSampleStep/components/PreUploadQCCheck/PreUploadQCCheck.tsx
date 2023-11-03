import { flatten, isEmpty } from "lodash/fp";
import { nanoid } from "nanoid";
import React, { useEffect, useState } from "react";
import { ANALYTICS_EVENT_NAMES, useTrackEvent } from "~/api/analytics";
import ExternalLink from "~/components/ui/controls/ExternalLink";
import {
  ILLUMINA,
  NANOPORE,
} from "~/components/views/SampleUploadFlow/constants";
import { SampleFromApi as Sample } from "~/interface/shared";
import IssueGroup from "~ui/notifications/IssueGroup";
import {
  DUPLICATE_ID,
  DUPLICATE_ID_ERROR,
  INVALID_FASTA_FASTQ,
  INVALID_FASTA_FASTQ_ERROR,
  MAX_READS_TO_CHECK,
  MEGABYTE,
  MISMATCH_FILES_ERROR,
  MISMATCH_SEQUENCING_PLATFORM,
  NO_VALID_SAMPLES,
  PAIRED_END_MISMATCHED,
  R1CHECK,
  R2CHECK,
  REGEX_READ_ILLUMINA,
  REGEX_READ_NANOPORE,
  TRUNCATED_FILE,
  TRUNCATED_FILE_ERROR,
} from "../../constants";
import { getFileType, getReadNames, sliceFile } from "../../utils";
import cs from "./pre_upload_qc_check.scss";

interface PreUploadQCCheckProps {
  samples?: Sample[];
  changeState?: $TSFixMeFunction;
  CLI: $TSFixMe;
  handleSampleDeselect?: $TSFixMeFunction;
  sequenceTechnology?: string;
}

const PreUploadQCCheck = ({
  samples,
  changeState,
  CLI,
  handleSampleDeselect,
  sequenceTechnology,
}: PreUploadQCCheckProps) => {
  const trackEvent = useTrackEvent();
  // Set for files that did not pass validateFileType
  const [invalidFiles, setInvalidFiles] = useState<Set<File>>(new Set());
  // Set for files that did not pass validateFASTADuplicates
  const [duplicateIds, setDuplicateIds] = useState<Set<File>>(new Set());
  // Set for files that did not pass validateFASTQNotTruncated
  const [truncatedFiles, setTruncatedFiles] = useState<Set<File>>(new Set());
  // Set for files that did not pass validateFASTQMatchingR1R2
  const [mismatchedFiles, setMismatchedFiles] = useState<Set<File>>(new Set());
  // Set for uncompressed files
  const [uncompressedFiles, setUncompressedFiles] = useState<Set<File>>(
    new Set(),
  );

  const FASTA_FILE_TYPE = "FASTA";
  const FASTQ_FILE_TYPE = "FASTQ";
  const UNKNOWN_FILE_TYPE = "unknown text";
  const GZ_FILE_TYPE = ".gz";
  const VALID_FASTQ_READ = "@";
  const VALID_FASTA_READ = ">";

  // Add libraries to CLI and mount each file
  const initializeCLI = async () => {
    // For each sample, extract all the files the user wants to upload, and mount them
    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2769
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
            // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
            return samples.some(object2 => {
              // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
              return object1.name in object2.files;
            });
          }),
        ),
    );

    setDuplicateIds(
      () =>
        new Set(
          [...duplicateIds].filter(object1 => {
            // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
            return samples.some(object2 => {
              // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
              return object1.name in object2.files;
            });
          }),
        ),
    );

    setTruncatedFiles(
      () =>
        new Set(
          [...truncatedFiles].filter(object1 => {
            // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
            return samples.some(object2 => {
              // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
              return object1.name in object2.files;
            });
          }),
        ),
    );

    setMismatchedFiles(
      () =>
        new Set(
          [...mismatchedFiles].filter(object1 => {
            // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
            return samples.some(object2 => {
              // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
              return object1.name in object2.files;
            });
          }),
        ),
    );

    setUncompressedFiles(
      () =>
        new Set(
          [...uncompressedFiles].filter(object1 => {
            // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
            return samples.some(object2 => {
              // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
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
      const fileType = await getFileType(CLI, file);

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
      // Check for duplicate FASTA IDs
      const readNames = await getReadNames(CLI, file);
      const readNamesUnique = new Set(readNames);
      if (readNames.length !== readNamesUnique.size) {
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
      const fastqContents = await sliceFile(CLI, file, byteStart, file.size);

      // Extract the last four lines, i.e. last FASTQ record of the file
      const fileContents = await fastqContents.text();
      const last4Lines = fileContents.trim().split("\n").slice(-4).join("\n");
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
      // Check whether read names are Illumina or Nanopore
      const fastqReadNames = await getReadNames(CLI, file);
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

      // Get read names
      const fastqReadNamesR1 = await getReadNames(CLI, fileR1);
      const fastqReadNamesR2 = await getReadNames(CLI, fileR2);

      // Iterate through read names until find a mismatch
      const count = Math.min(
        MAX_READS_TO_CHECK,
        fastqReadNamesR1.length,
        fastqReadNamesR2.length,
      );
      for (let i = 0; i < count; i++) {
        const isPaired =
          findDiff(fastqReadNamesR1[i], fastqReadNamesR2[i]) === "";
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
    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
    if (samples.every(element => element.finishedValidating === true)) {
      let result = true;
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
      samples.forEach(element => {
        if (element.isValid) {
          // File is FASTA or FASTQ file does not have format
          if (!element.format) result = false;
          /* Illumina Technology is selected and format is illumina
             -OR-
             Nanopore is selected and format is nanopore
          */ else if (
            (sequenceTechnology === ILLUMINA && element.format === ILLUMINA) ||
            (sequenceTechnology === NANOPORE && element.format === NANOPORE)
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
    // Remove /1 and /2 from read names to support other naming conventions besides illumina (e.g. SRA)
    // for new illumina file format also remove " 1" and " 2" source: https://support.illumina.com/help/BaseSpace_OLH_009008/Content/Source/Informatics/BS/FileFormat_FASTQ-files_swBS.htm
    // str1 and str2 have already been validated to be illumina via REGEX_READ_ILLUMINA so stripping out the regex is safe
    const str1Stripped = str1.replace(/(\/1|\s1)/g, "");
    const str2Stripped = str2.replace(/(\/2|\s2)/g, "");

    let diff = "";
    str2Stripped.split("").forEach((val, i) => {
      if (val !== str1Stripped.charAt(i)) diff += val;
    });
    return diff;
  };

  // Run each validation check for each file
  const runAllValidationChecks = async () => {
    let cumulativeInvalidFileSizes = 0;

    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
    for (const sample of samples) {
      // Skip validation if already done on this sample
      if (sample.finishedValidating === true) {
        if (!sample.isValid) {
          // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2769
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
          if (
            technologyType === ILLUMINA &&
            (fileName.includes(R1CHECK) || fileName.includes(R2CHECK))
          ) {
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

          // 6. Check if the file is compressed (warn-only, do not block user from uploading)
          if (!file.name.includes(GZ_FILE_TYPE)) {
            setUncompressedFiles(arr => new Set([...arr, file]));
          }
        }
      }
      sample.finishedValidating = true;
      sample.isValid = sampleIsValid;
      if (!sampleIsValid) {
        // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2769
        Object.values(sample.files).forEach(
          f => (cumulativeInvalidFileSizes += f.size),
        );
      }
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2722
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
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2722
      handleSampleDeselect(sample._selectId, false, "local");
    } else if (sample.format) {
      if (sample.format === ILLUMINA)
        // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2722
        handleSampleDeselect(
          sample._selectId,
          sample.format === ILLUMINA && sequenceTechnology !== NANOPORE,
          "local",
        );
      else if (sample.format === NANOPORE)
        // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2722
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
    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
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
    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
    samples.forEach(element =>
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2769
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
          // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
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
          // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
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
        {uncompressedFiles.size > 0 && (
          <IssueGroup
            className={cs.issue}
            caption={
              <span>
                {uncompressedFiles.size + " file"}
                {uncompressedFiles.size > 1 ? "s are " : " is "}
                uncompressed. We recommend compressing your files for faster
                upload times.
              </span>
            }
            headers={["File Name"]}
            rows={[...uncompressedFiles].map(name => [name])}
            type="warning"
          />
        )}
        {validateAllSamplesAreInvalid() && (
          <IssueGroup
            caption={`There are no valid samples available for upload. Please fix the errors or select more files. If needed, contact us at our Help Center for assistance.`}
            headers={["File Name"]}
            rows={addAllFilesIntoArray().map(name => [name.name])}
            type="error"
          />
        )}
      </div>
    </div>
  );
};

export { PreUploadQCCheck };
