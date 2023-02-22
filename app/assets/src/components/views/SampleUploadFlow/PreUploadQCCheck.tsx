import Aioli from "@biowasm/aioli";
import { isEmpty } from "lodash/fp";
import React, { useEffect, useState } from "react";
import { ANALYTICS_EVENT_NAMES, trackEvent } from "~/api/analytics";
import ExternalLink from "~/components/ui/controls/ExternalLink";
import { SampleFromApi as Sample } from "~/interface/shared";
import IssueGroup from "~ui/notifications/IssueGroup";
import {
  ERROR_MESSAGE,
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
  const [invalidFiles, setInvalidFiles] = useState<Set<Sample>>(new Set());
  // Set for files that did not pass validateDuplicates
  const [duplicateIds, setDuplicateIds] = useState<Set<Sample>>(new Set());
  // Set for files that did not pass validateTruncatedFile
  const [truncatedFiles, setTruncatedFiles] = useState<Set<Sample>>(new Set());
  // Set for files that did not pass validateMismatchedFiles
  const [mismatchedFiles, setMismatchedFiles] = useState<Set<Sample>>(
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
    const pathToAssets = `${location.origin}/assets`;
    CLI = await new Aioli([
      {
        tool: "htslib",
        program: "htsfile",
        version: "1.10",
        urlPrefix: pathToAssets,
      },
      {
        tool: "seqtk",
        version: "1.3",
        urlPrefix: pathToAssets,
      },
    ]);

    for (let i = 0; i < samples.length; i++) {
      const passedFile = samples[i];
      for (const key in passedFile.files) {
        await CLI.mount(passedFile.files[key]);
      }
    }
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
  const validateFileType = async (fileName: $TSFixMe) => {
    let result = "";

    try {
      const fileType = await CLI.exec(`htsfile ${fileName.name}`);

      // Will return either "FASTA text", "FASTQ sequence text", or "unknown text"
      if (fileType.includes(UNKNOWN_FILE_TYPE) && !invalidFiles.has(fileName)) {
        setInvalidFiles(arr => new Set([...arr, fileName]));
        trackEvent(ANALYTICS_EVENT_NAMES.PRE_UPLOAD_QC_CHECK_WARNING_TYPE, {
          error: INVALID_FASTA_FASTQ,
        });
        return ERROR_MESSAGE;
      }
      result += fileType;
    } catch (e) {
      result += ERROR_MESSAGE;
    }
    return result;
  };

  // Validate if FASTA file has duplicate sequences
  const validateDuplicates = async (fileName: $TSFixMe) => {
    try {
      const slicedFileToNewFile = sliceFile(fileName, 0, MEGABYTE);

      // Returns string of file that is seperated by new line (common transformation of FASTA/Q)
      const seqtkSeqResult = await CLI.exec(
        `seqtk seq -l0 ${slicedFileToNewFile.name}`,
      );

      // Split string by new line and filter out only sequence IDs
      const arr = filterArrayByIndex(seqtkSeqResult, 2);

      const ids: $TSFixMe = [];

      // Iterate through the Sequence IDs and check if there are any duplicates
      for (let i = 0; i < arr.length; i++) {
        if (ids.includes(arr[i]) && !duplicateIds.has(fileName)) {
          setDuplicateIds(dup => new Set([...dup, fileName]));
          trackEvent(ANALYTICS_EVENT_NAMES.PRE_UPLOAD_QC_CHECK_WARNING_TYPE, {
            error: DUPLICATE_ID,
          });
          return false;
        }
        ids.push(arr[i]);
      }
    } catch (e) {
      return false;
    }
    return true;
  };

  // Validate if the file FASTQ file is truncated
  const validateTruncatedFile = async (fileName: $TSFixMe) => {
    try {
      // Get the last megabyte of the file
      const byteEnd = Math.ceil(fileName.size);
      const byteIndex = Math.max(0, byteEnd - 1000000);
      const slicedFileToNewFile = sliceFile(fileName, byteIndex, byteEnd);

      // Extract last four lines
      const fileContents = await slicedFileToNewFile.text();
      const arr = fileContents.trim().split(/\n/);
      const lastFourLines = arr.slice(-4);
      const fourLines = lastFourLines.join("\n");

      // Create blob with last four lines and mount it
      const blob = {
        name: fileName.name,
        data: new Blob([fourLines], { type: "text/plain" }),
      };
      await CLI.mount(blob);
      // Returns string of file that is seperated by new line (common transformation of FASTA/Q)
      const seqtkSeqResult = await CLI.exec(`seqtk seq ${fileName.name}`);
      const seqtkSeqResultFirstChar = seqtkSeqResult[0];

      //  We can detect various scenarios based on the output of seqtk:
      //  ""  seqtk did not detect a valid FASTA or FASTQ sequence in the last 4 lines
      // "@"  seqtk detected a valid FASTQ read (FASTQ read names start with @)
      //  ">" seqtk detected a valid FASTA record (FASTA sequence names start with >)
      if (
        (seqtkSeqResultFirstChar !== VALID_FASTQ_READ ||
          isEmpty(seqtkSeqResult) ||
          seqtkSeqResultFirstChar === VALID_FASTA_READ) &&
        !truncatedFiles.has(fileName)
      ) {
        setTruncatedFiles(arr => new Set([...arr, fileName]));
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

  // Validate if R1 and R2 file are paired-end mismatched
  const validateMismatchedFiles = async (
    fileNameR1: $TSFixMe,
    fileNameR2: $TSFixMe,
  ) => {
    try {
      // Preprocessing to make sure the fileNameR1 includes R1 and fileNameR2 includes R2
      if (fileNameR1.name.includes(R2CHECK)) {
        const tempFileName = fileNameR1;
        fileNameR1 = fileNameR2;
        fileNameR2 = tempFileName;
      }

      // Slice file to first megabyte
      const slicedFileToNewFileR1 = sliceFile(fileNameR1, 0, MEGABYTE);
      const slicedFileToNewFileR2 = sliceFile(fileNameR2, 0, MEGABYTE);

      // Get File contents from file
      const fileContentsR1 = await slicedFileToNewFileR1.text();
      const fileContentsR2 = await slicedFileToNewFileR2.text();

      // Filter only the sequence identifier to array
      const arrR1 = filterArrayByIndex(fileContentsR1, 4);
      const arrR2 = filterArrayByIndex(fileContentsR2, 4);

      // Iterate through Seqeunces Identifiers
      for (let i = 0; i < arrR1.length; i++) {
        const sequenceIsNotPairwise = findDiff(arrR1[i], arrR2[i]) !== "2";
        if (sequenceIsNotPairwise) {
          setMismatchedFiles(arr => new Set([...arr, fileNameR1, fileNameR2]));
          trackEvent(ANALYTICS_EVENT_NAMES.PRE_UPLOAD_QC_CHECK_WARNING_TYPE, {
            error: PAIRED_END_MISMATCHED,
          });
          return false;
        }
      }
    } catch (e) {
      return false;
    }
    return true;
  };

  // Validate that there are no mismatch sequencing
  const addFormatToFile = async (file: $TSFixMe, key: $TSFixMe) => {
    try {
      const fileName = file.files[key];
      const fileContents = await fileName.text();

      const arr = filterArrayByIndex(fileContents, 4);
      const nanoporeRegexExp = /^@[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[4][a-fA-F0-9]{3}-[89ABab][a-fA-F0-9]{3}-[a-fA-F0-9]{12}$/i;

      const illuminiaRegexExp = /^@[a-zA-z0-9]+:[0-9]+:[a-zA-Z0-9]+:[0-9]+:[0-9]+:[0-9]+:[0-9]+(:[ATGCN]+[+][ATGCN]+)*[ 12]{2}:[YN]:[0-9]+:[ATGCN]+([+][ATGCN]+)*$/i;

      let isIlluminaFormat = true;
      let isNanoporeFormat = true;

      for (let i = 0; i < arr.length; i++) {
        const sequenceIdentifer = arr[i];

        if (isIlluminaFormat && !illuminiaRegexExp.test(sequenceIdentifer)) {
          isIlluminaFormat = false;
        }
        if (isNanoporeFormat && !nanoporeRegexExp.test(sequenceIdentifer)) {
          isNanoporeFormat = false;
        }
      }
      if (isIlluminaFormat || isNanoporeFormat)
        file.format = isIlluminaFormat ? ILLUMINA : NANOPORE;
    } catch (e) {
      return ERROR_MESSAGE;
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

  // Filter array by an index
  const filterArrayByIndex = (fileContents: $TSFixMe, index: $TSFixMe) => {
    return fileContents
      .trim()
      .split(/\n/)
      .filter((_element: $TSFixMe, i: $TSFixMe) => {
        return i % index === 0;
      });
  };

  // Slice File
  const sliceFile = (fileName: $TSFixMe, start: $TSFixMe, end: $TSFixMe) => {
    const slicedFile = fileName.slice(start, end);
    return new File([slicedFile], fileName.name);
  };

  // Find difference between string, returns characters that are in str2 that are not in str1
  const findDiff = (str1: string, str2: string) => {
    let diff = "";
    str2.split("").forEach((val, i) => {
      if (val !== str1.charAt(i)) diff += val;
    });
    return diff;
  };

  // Run each validation check for each file
  const runAllValidationChecks = async () => {
    let cumulativeInvalidFileSizes = 0;

    for (let i = 0; i < samples.length; i++) {
      const passedFile = samples[i];
      if (passedFile.finishedValidating === true) {
        if (!passedFile.isValid) {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          Object.entries(passedFile.files).forEach(([_fileName, file]) => {
            cumulativeInvalidFileSizes += file.size;
          });
        }
        handleCheckbox(passedFile);
        continue;
      }
      let fileIsValid = true;

      for (const key in passedFile.files) {
        const validatedFastaOrFastq = await validateFileType(
          passedFile.files[key],
        );
        if (validatedFastaOrFastq === ERROR_MESSAGE) {
          fileIsValid = false;
          passedFile.error = INVALID_FASTA_FASTQ_ERROR;
          break;
        } else if (validatedFastaOrFastq.includes(FASTA_FILE_TYPE)) {
          const validatedDuplicates = await validateDuplicates(
            passedFile.files[key],
          );
          if (!validatedDuplicates) {
            fileIsValid = false;
            passedFile.error = DUPLICATE_ID_ERROR;
          }
        } else if (validatedFastaOrFastq.includes(FASTQ_FILE_TYPE)) {
          // Don't check for truncation/matching paired-ends for .gz files
          if (!passedFile.files[key].name.includes(GZ_FILE_TYPE)) {
            const validatedTruncatedFile = await validateTruncatedFile(
              passedFile.files[key],
            );
            if (!validatedTruncatedFile) {
              fileIsValid = false;
              passedFile.error = TRUNCATED_FILE_ERROR;
            }
            await addFormatToFile(passedFile, key);
            // Check to see if FASTQ file has matching R1/R2 file
            if (key.includes(R1CHECK) || key.includes(R2CHECK)) {
              const pairedEndSample = key.includes(R1CHECK)
                ? key.replace(R1CHECK, R2CHECK)
                : key.replace(R2CHECK, R1CHECK);
              if (
                key in passedFile.files &&
                pairedEndSample in passedFile.files
              ) {
                const validatedMismatchedFiles = await validateMismatchedFiles(
                  passedFile.files[key],
                  passedFile.files[pairedEndSample],
                );
                if (!validatedMismatchedFiles) {
                  fileIsValid = false;
                  passedFile.error = MISMATCH_FILES_ERROR;
                }
              }
            }
          }
        }
      }
      passedFile.finishedValidating = true;
      passedFile.isValid = fileIsValid;
      if (!fileIsValid) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        Object.entries(passedFile.files).forEach(([_fileName, file]) => {
          cumulativeInvalidFileSizes += file.size;
        });
      }
      changeState(samples);
      handleCheckbox(passedFile);
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
  const handleCheckbox = (passedFile: Sample) => {
    if (!passedFile.isValid) {
      handleSampleDeselect(passedFile._selectId, false, "local");
    } else if (passedFile.format) {
      if (passedFile.format === ILLUMINA)
        handleSampleDeselect(
          passedFile._selectId,
          passedFile.format === ILLUMINA && sequenceTechnology !== NANOPORE,
          "local",
        );
      else if (passedFile.format === NANOPORE)
        handleSampleDeselect(
          passedFile._selectId,
          passedFile.format === NANOPORE && sequenceTechnology !== ILLUMINA,
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
