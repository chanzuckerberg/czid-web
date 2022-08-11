import Aioli from "@biowasm/aioli";
import { isEmpty } from "lodash/fp";
import PropTypes from "prop-types";
import React, { useEffect, useState } from "react";
import { ANALYTICS_EVENT_NAMES, trackEvent } from "~/api/analytics";
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

const PreUploadQCCheck = ({
  samples,
  changeState,
  handleSampleSelect,
  sequenceTechnology,
}) => {
  // CLI is used for calling some of the bioinformatics tools for PreUploadQC checks (biowasm, etc...)
  let CLI;
  // Set for files that did not pass validateFileType
  const [invalidFiles, setInvalidFiles] = useState(new Set());
  // Set for files that did not pass validateDuplicates
  const [duplicateIds, setDuplicateIds] = useState(new Set());
  // Set for files that did not pass validateTruncatedFile
  const [truncatedFiles, setTruncatedFiles] = useState(new Set());
  // Set for files that did not pass validateMismatchedFiles
  const [mismatchedFiles, setMismatchedFiles] = useState(new Set());

  const FASTA_FILE_TYPE = "FASTA";
  const FASTQ_FILE_TYPE = "FASTQ";
  const UNKNOWN_FILE_TYPE = "unknown text";
  const GZ_FILE_TYPE = ".gz";
  const VALID_FASTQ_READ = "@";
  const VALID_FASTA_READ = ">";

  // Add libraries to CLI and mount each file
  const initializeCLI = async () => {
    const pathToAssets = `${location.origin}/assets`;
    CLI = await new Aioli(
      [
        {
          tool: "htslib",
          program: "htsfile",
          version: "1.10",
          urlPrefix: `${pathToAssets}/htslib`,
        },
        {
          tool: "seqtk",
          version: "1.3",
          urlPrefix: `${pathToAssets}/seqtk`,
        },
      ],
      {
        urlAioli: `${pathToAssets}/aioli.worker.js`,
        urlBaseModule: `${pathToAssets}/base`,
      },
    );

    for (let i = 0; i < samples.length; i++) {
      let passedFile = samples[i];
      for (var key in passedFile.files) {
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
      arr =>
        new Set(
          [...invalidFiles].filter(object1 => {
            return samples.some(object2 => {
              return object1.name in object2.files;
            });
          }),
        ),
    );

    setDuplicateIds(
      arr =>
        new Set(
          [...duplicateIds].filter(object1 => {
            return samples.some(object2 => {
              return object1.name in object2.files;
            });
          }),
        ),
    );

    setTruncatedFiles(
      arr =>
        new Set(
          [...truncatedFiles].filter(object1 => {
            return samples.some(object2 => {
              return object1.name in object2.files;
            });
          }),
        ),
    );

    setMismatchedFiles(
      arr =>
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
  const validateFileType = async fileName => {
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
  const validateDuplicates = async fileName => {
    try {
      let slicedFileToNewFile = sliceFile(fileName, 0, MEGABYTE);

      // Returns string of file that is seperated by new line (common transformation of FASTA/Q)
      const seqtkSeqResult = await CLI.exec(
        `seqtk seq -l0 ${slicedFileToNewFile.name}`,
      );

      // Split string by new line and filter out only sequence IDs
      const arr = filterArrayByIndex(seqtkSeqResult, 2);

      const ids = [];

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
  const validateTruncatedFile = async fileName => {
    try {
      // Get the last megabyte of the file
      const byteEnd = Math.ceil(fileName.size);
      const byteIndex = Math.max(0, byteEnd - 1000000);
      let slicedFileToNewFile = sliceFile(fileName, byteIndex, byteEnd);

      // Extract last four lines
      const fileContents = await slicedFileToNewFile.text();
      const arr = fileContents.trim().split(/\n/);
      let lastFourLines = arr.slice(-4);
      let fourLines = lastFourLines.join("\r\n");

      // Create blob with last four lines and mount it
      var blob = {
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
  const validateMismatchedFiles = async (fileNameR1, fileNameR2) => {
    try {
      // Preprocessing to make sure the fileNameR1 includes R1 and fileNameR2 includes R2
      if (fileNameR1.name.includes(R2CHECK)) {
        const tempFileName = fileNameR1;
        fileNameR1 = fileNameR2;
        fileNameR2 = tempFileName;
      }

      // Slice file to first megabyte
      let slicedFileToNewFileR1 = sliceFile(fileNameR1, 0, MEGABYTE);
      let slicedFileToNewFileR2 = sliceFile(fileNameR2, 0, MEGABYTE);

      // Get File contents from file
      let fileContentsR1 = await slicedFileToNewFileR1.text();
      let fileContentsR2 = await slicedFileToNewFileR2.text();

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
  const addFormatToFile = async (file, key) => {
    try {
      let fileName = file.files[key];
      let fileContents = await fileName.text();

      const arr = filterArrayByIndex(fileContents, 4);

      const nanoporeRegexExp = /^[0-9A-F]{8}-[0-9A-F]{4}-[4][0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i;

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
  const filterArrayByIndex = (fileContents, index) => {
    return fileContents
      .trim()
      .split(/\n/)
      .filter((element, i) => {
        return i % index === 0;
      });
  };

  // Slice File
  const sliceFile = (fileName, start, end) => {
    const slicedFile = fileName.slice(start, end);
    return new File([slicedFile], fileName.name);
  };

  // Find difference between string, returns characters that are in str2 that are not in str1
  const findDiff = (str1, str2) => {
    let diff = "";
    str2.split("").forEach((val, i) => {
      if (val !== str1.charAt(i)) diff += val;
    });
    return diff;
  };

  // Run each validation check for each file
  const runAllValidationChecks = async () => {
    for (let i = 0; i < samples.length; i++) {
      let passedFile = samples[i];
      if (passedFile.finishedValidating === true) {
        handleCheckbox(passedFile);
        continue;
      }
      let fileIsValid = true;

      for (var key in passedFile.files) {
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
          // Do not want to check if .gz files are truncated
          if (!passedFile.files[key].name.includes(GZ_FILE_TYPE)) {
            const validatedTruncatedFile = await validateTruncatedFile(
              passedFile.files[key],
            );
            if (!validatedTruncatedFile) {
              fileIsValid = false;
              passedFile.error = TRUNCATED_FILE_ERROR;
            }
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
      passedFile.finishedValidating = true;
      passedFile.isValid = fileIsValid;
      changeState(samples);
      handleCheckbox(passedFile);
    }
  };

  // Delete samples from selected IDs if file is invalid
  const handleCheckbox = passedFile => {
    if (!passedFile.isValid) {
      handleSampleSelect(passedFile._selectId, false, "local");
    } else if (passedFile.format) {
      if (passedFile.format === ILLUMINA)
        handleSampleSelect(
          passedFile._selectId,
          passedFile.format === ILLUMINA && sequenceTechnology !== NANOPORE,
          "local",
        );
      else if (passedFile.format === NANOPORE)
        handleSampleSelect(
          passedFile._selectId,
          passedFile.format === NANOPORE && sequenceTechnology !== ILLUMINA,
          "local",
        );
    }
  };

  // Rerenders whenever samples, or sequence technolgoy changes
  useEffect(() => {
    wrapper();
  }, [samples, sequenceTechnology]);

  // Adds every file into array
  const addAllFilesIntoArray = () => {
    const allFiles = [];
    samples.forEach(element =>
      Object.values(element.files).forEach(val => allFiles.push(val)),
    );
    return allFiles;
  };

  return (
    <div>
      <div>
        {invalidFiles.size > 0 && (
          <IssueGroup
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
            caption={`${duplicateIds.size} file${
              duplicateIds.size > 1 ? "s" : ""
            } 
            will not be uploaded because there are duplicate read IDs.  Tip! You can use the SeqKit method “rename” on the duplicate read IDs in your FASTA file to make them unique. Check out SeqKit documentation 
            here`}
            headers={["File Name"]}
            rows={[...duplicateIds].map(name => [name])}
            type="warning"
          />
        )}
        {truncatedFiles.size > 0 && (
          <IssueGroup
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
            caption={`${mismatchedFiles.size} file${
              mismatchedFiles.size > 1 ? "s" : ""
            } 
            won't be uploaded because thee paired-end files are not matching. Tip! You can use use the SeqKit method named "pair" to sort your FASTQ files so that R1 and R2 reads match up. Check out SeqKit documentation here.`}
            headers={["File Name"]}
            rows={[...mismatchedFiles].map(name => [name])}
            type="warning"
          />
        )}
        {sequenceTechnology === ILLUMINA &&
          samples.some(element => element.format === NANOPORE) && (
            <IssueGroup
              caption={`${
                samples.filter(element => element.format === NANOPORE).length
              } 
              file${
                samples.filter(element => element.format === NANOPORE).length >
                1
                  ? "s"
                  : ""
              } 
              will not be uploaded. You selected Illumina as the sequencing platform, but the 
              file${
                samples.filter(element => element.format === NANOPORE).length >
                1
                  ? "s"
                  : ""
              } 
              does not appear to be an Illumina output.`}
              headers={["File Name"]}
              rows={samples
                .filter(element => element.format === NANOPORE)
                .map(name => [name.name])}
              type="warning"
            />
          )}
        {sequenceTechnology === NANOPORE &&
          samples.some(element => element.format === ILLUMINA) && (
            <IssueGroup
              caption={`${
                samples.filter(element => element.format === ILLUMINA).length
              } file${
                samples.filter(element => element.format === ILLUMINA).length >
                1
                  ? "s"
                  : ""
              } 
              will not be uploaded. You selected Nanopore as the sequencing platform, but the file${
                samples.filter(element => element.format === ILLUMINA).length >
                1
                  ? "s"
                  : ""
              } 
              does not appear to be a Nanopore output.`}
              headers={["File Name"]}
              rows={samples
                .filter(element => element.format === ILLUMINA)
                .map(name => [name.name])}
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

PreUploadQCCheck.propTypes = {
  samples: PropTypes.array,
  changeState: PropTypes.func,
  handleSampleSelect: PropTypes.func,
  sequenceTechnology: PropTypes.string,
};

export default PreUploadQCCheck;