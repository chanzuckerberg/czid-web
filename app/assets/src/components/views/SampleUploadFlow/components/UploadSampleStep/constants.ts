// The Illumina regex only matches the beginning of the read to support both Casava 1.8 and older read names
export const REGEX_READ_ILLUMINA =
  /^@[a-z0-9]+:[0-9]+:[a-z0-9-]+:[0-9]+:[0-9]+:[0-9]+:[0-9]+/i;
// The Nanopore regex only matches the beginning of the read to support reads with tags such as run_id and barcode
export const REGEX_READ_NANOPORE =
  /^@[a-f0-9]{8}-[a-f0-9]{4}-[4][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}/i;

export const MAX_READS_TO_CHECK = 100;
export const MEGABYTE = 1000000;
export const INVALID_FASTA_FASTQ = "Invalid FASTA or FASTQ ";
export const MISMATCH_SEQUENCING_PLATFORM = "Mismatch sequencing platform";
export const TRUNCATED_FILE = "Truncated File";
export const PAIRED_END_MISMATCHED = "Paired End Mismatched";
export const DUPLICATE_ID = "Duplicated Read Ids inFASTA files";
export const NO_VALID_SAMPLES = "No valid Samples";
export const DUPLICATE_ID_ERROR =
  "This file has duplicate IDs. Please make sure all read IDs are unique.";
export const INVALID_FASTA_FASTQ_ERROR =
  "This is not valid FASTA or FASTQ file. Please make sure your file is either a FASTA or FASTQ. ";
export const TRUNCATED_FILE_ERROR =
  "This file is truncated. Please make sure your FASTQ file is subsampled to a number of lines divisible by 4.";
export const MISMATCH_FORMAT_ERROR =
  "This file does not match the sequencing technology selected. Please make sure that you have selected the correct sequencing technology for this file.";
export const MISMATCH_FILES_ERROR =
  "R1 and R2 files are paired-end mismatched. Please make sure that R1 and R2 files reads match up.";
export const REF_SEQ_FILE_NAME_ERROR_MESSAGE =
  "Reference file name can only contain letters, numbers, dashes, parenthesis and underscores";
export const UNSUPPORTED_UPLOAD_OPTION_TOOLTIP =
  "This upload option is not supported for this pipeline.";
export const R1CHECK = "_R1";
export const R2CHECK = "_R2";

export const FASTA_FILE_TYPE = "FASTA";
export const FASTQ_FILE_TYPE = "FASTQ";
export const UNKNOWN_FILE_TYPE = "unknown text";

// Regex that matches NCBI GenBank RefSeq headers, i.e. ">MN908947.3 Severe acute respiratory syndrome coronavirus 2 isolate Wuhan-Hu-1, complete genome"
//    - Capture group 1: accession number, i.e. "MN908947.3"
//    - Capture group 2: accession name, i.e. "Severe acute respiratory syndrome coronavirus 2 isolate Wuhan-Hu-1, complete genome"
// See: https://www.ncbi.nlm.nih.gov/books/NBK21091/table/ch18.T.refseq_accession_numbers_and_mole/?report=objectonly/
export const NCBI_GENBANK_REF_SEQ_HEADER_REGEX =
  /^>([A-Z]{2}_?\d{6,}(?:\.\d)?)\s(.*)$/;
