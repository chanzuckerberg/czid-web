import { nanoid } from "nanoid";
import {
  FASTQ_FILE_TYPE,
  MAX_READS_TO_CHECK,
  MEGABYTE,
  UNKNOWN_FILE_TYPE,
} from "~/components/views/SampleUploadFlow/components/UploadSampleStep/constants";

// Retrieve read names in first 1MB of a FASTA or FASTQ file
export const getReadNames = async (CLI: $TSFixMe, file: File) => {
  // Get first 1MB of file (we go through seqtk to ensure .gz support).
  // Note: `-A` forces FASTA output (so this function can be used with FASTQ files too),
  // and `-l0` forces FASTA/FASTQ output to be single line.
  const fileSlice = await sliceFile(CLI, file, 0, MEGABYTE);
  const fastaContents = await CLI.exec(`seqtk seq -A -l0 ${fileSlice.name}`);

  // Validate file type
  const fileType = await getFileType(CLI, file);
  if (fileType.includes(UNKNOWN_FILE_TYPE)) return false;

  // Extract read names
  return fastaContents
    .split("\n")
    .filter((line: string) => line.startsWith(">"))
    .slice(0, MAX_READS_TO_CHECK)
    .map(name => {
      if (fileType.includes(FASTQ_FILE_TYPE)) return "@" + name.substring(1);
      return name;
    });
};

// Slice a File object, create a new File, and mount it on to filesystem
export const sliceFile = async (
  CLI: $TSFixMe,
  file: File,
  start: number,
  end: number,
) => {
  // Take a slice of the file and make it into a new file
  const blob = file.slice(start, end);
  const fileSlice = new File([blob], `${file.name}.${nanoid()}.slice`);

  // Mount it so you can run CLI commands on the file
  await CLI.mount(fileSlice);
  return fileSlice;
};

// Return either "FASTA text", "FASTQ sequence text", or "unknown text"
export const getFileType = async (CLI: $TSFixMe, file: File) => {
  try {
    return await CLI.exec(`htsfile ${file.name}`);
  } catch (e) {
    return UNKNOWN_FILE_TYPE;
  }
};
