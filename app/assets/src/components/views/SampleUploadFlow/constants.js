export const NO_TARGET_PROJECT_ERROR =
  "Please select an IDseq project to upload your samples to.";

export const NO_VALID_SAMPLES_FOUND_ERROR = "No valid samples were found.";

export const SELECT_ID_KEY = "_selectId";

export const CG_WETLAB_OPTIONS = [
  {
    text: "ARTIC v3",
    value: "artic",
  },
  {
    text: "ARTIC v3 - Short Amplicons (275 bp)",
    value: "artic_short_amplicons",
  },
  {
    text: "MSSPE",
    value: "msspe",
  },
  {
    text: "Combined MSSPE & ARTIC v3",
    value: "combined_msspe_artic",
  },
  {
    text: "SNAP",
    value: "snap",
  },
  {
    text: "AmpliSeq",
    value: "ampliseq",
  },
];

export const CG_TECHNOLOGY_OPTIONS = {
  ILLUMINA: "Illumina",
  NANOPORE: "ONT",
};

export const TEMP_DEFAULT_NANOPORE_WETLAB_OPTION = "artic";
