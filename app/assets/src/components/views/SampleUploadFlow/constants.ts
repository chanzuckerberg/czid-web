import { WORKFLOWS } from "~/components/utils/workflows";

export const NO_TARGET_PROJECT_ERROR =
  "Please select a CZ ID project to upload your samples to.";

export const NO_VALID_SAMPLES_FOUND_ERROR = "No valid samples were found.";

export const SELECT_ID_KEY = "_selectId";
export const ILLUMINA = "Illumina";
export const NANOPORE = "ONT";
export const NO_TECHNOLOGY_SELECTED = "noTechnologySelected";

export const UPLOAD_WORKFLOWS = {
  MNGS: {
    label: "Metagenomics" as const,
    value: "mngs" as const,
    icon: "dna" as const,
  },
  CONSENSUS_GENOME: {
    label: "SARS-CoV-2 Consensus Genome" as const,
    value: WORKFLOWS.CONSENSUS_GENOME.value,
    icon: "virus" as const,
  },
  AMR: {
    label: "Antimicrobial Resistance" as const,
    value: WORKFLOWS.AMR.value,
    icon: "bacteria" as const,
  },
};

export const UPLOAD_WORKFLOW_KEY_FOR_VALUE = {
  [UPLOAD_WORKFLOWS.MNGS.value]: "MNGS" as const,
  [UPLOAD_WORKFLOWS.CONSENSUS_GENOME.value]: "CONSENSUS_GENOME" as const,
  [UPLOAD_WORKFLOWS.AMR.value]: "AMR" as const,
};

export const ALLOWED_UPLOAD_WORKFLOWS_BY_TECHNOLOGY = {
  [UPLOAD_WORKFLOWS.MNGS.value]: {
    [ILLUMINA]: [UPLOAD_WORKFLOWS.MNGS.value, WORKFLOWS.AMR.value],
    [NANOPORE]: [UPLOAD_WORKFLOWS.MNGS.value],
    [NO_TECHNOLOGY_SELECTED]: [
      UPLOAD_WORKFLOWS.MNGS.value,
      WORKFLOWS.AMR.value,
    ], // Case when user does not have access to ont_v1
  },
  [UPLOAD_WORKFLOWS.AMR.value]: {
    [ILLUMINA]: [UPLOAD_WORKFLOWS.AMR.value, UPLOAD_WORKFLOWS.MNGS.value], // Case when short-read-mngs and amr are both selected
    [NO_TECHNOLOGY_SELECTED]: [
      UPLOAD_WORKFLOWS.AMR.value,
      UPLOAD_WORKFLOWS.MNGS.value,
    ], // Case when only amr is selected
  },
  [UPLOAD_WORKFLOWS.CONSENSUS_GENOME.value]: {
    [ILLUMINA]: [UPLOAD_WORKFLOWS.CONSENSUS_GENOME.value],
    [NANOPORE]: [UPLOAD_WORKFLOWS.CONSENSUS_GENOME.value],
  },
};

export const WORKFLOWS_BY_UPLOAD_SELECTIONS = {
  [UPLOAD_WORKFLOWS.MNGS.value]: {
    [ILLUMINA]: WORKFLOWS.SHORT_READ_MNGS.value,
    [NANOPORE]: WORKFLOWS.LONG_READ_MNGS.value,
    [NO_TECHNOLOGY_SELECTED]: WORKFLOWS.SHORT_READ_MNGS.value, // Case when user does not have access to ont_v1
  },
  [UPLOAD_WORKFLOWS.AMR.value]: {
    [ILLUMINA]: WORKFLOWS.AMR.value, // Case when short-read-mngs and amr are both selected
    [NO_TECHNOLOGY_SELECTED]: WORKFLOWS.AMR.value, // Case when only amr is selected
  },
  [UPLOAD_WORKFLOWS.CONSENSUS_GENOME.value]: {
    [ILLUMINA]: WORKFLOWS.CONSENSUS_GENOME.value,
    [NANOPORE]: WORKFLOWS.CONSENSUS_GENOME.value,
  },
};

export enum SEQUENCING_TECHNOLOGY_OPTIONS {
  ILLUMINA = "Illumina",
  NANOPORE = "ONT",
}

export const SEQUENCING_TECHNOLOGY_DISPLAY_NAMES = {
  Illumina: "Illumina",
  ONT: "Nanopore",
};

export const GUPPY_BASECALLER_SETTINGS = [
  {
    text: "fast",
    value: "fast",
  },
  {
    text: "hac",
    value: "hac",
  },
  {
    text: "super",
    value: "super",
  },
];

// WARNING: If you are adding an option here, you probably also want to add it to: https://github.com/chanzuckerberg/czid-cli
export const CG_WETLAB_OPTIONS = [
  {
    text: "ARTIC v4/ARTIC v4.1",
    value: "artic_v4",
  },
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
  {
    text: "COVIDseq",
    value: "covidseq",
  },
  {
    text: "VarSkip",
    value: "varskip",
  },
  {
    text: "Midnight",
    value: "midnight",
  },
  {
    text: "Easyseq",
    value: "easyseq",
  },
];

export const CG_WETLAB_DISPLAY_NAMES = {
  ampliseq: "AmpliSeq",
  artic_short_amplicons: "ARTIC v3 - Short Amplicons (275 bp)",
  artic_v4: "ARTIC v4/ARTIC v4.1",
  artic: "ARTIC v3",
  combined_msspe_artic: "Combined MSSPE & ARTIC v3",
  covidseq: "COVIDseq",
  midnight: "Midnight",
  msspe: "MSSPE",
  snap: "SNAP",
  varskip: "varskip",
  easyseq: "easyseq",
};

// WARNING: If you are adding an option here, you probably also want to add it to: https://github.com/chanzuckerberg/czid-cli
export const CG_NANOPORE_WETLAB_OPTIONS = [
  {
    text: "ARTIC v3",
    value: "artic",
  },
  {
    text: "Midnight",
    value: "midnight",
  },
  {
    text: "ARTIC v4/ARTIC v4.1",
    value: "artic_v4",
  },
  {
    text: "VarSkip",
    value: "varskip",
  },
];

export const DEFAULT_NANOPORE_WETLAB_OPTION = "artic";

export const DEFAULT_MEDAKA_MODEL_OPTION = "r941_min_high_g360";

export const MEDAKA_MODEL_OPTIONS = {
  DEFAULT: {
    displayName: "default",
    options: [
      {
        text: "r941_min_high_g360",
        value: "r941_min_high_g360",
        subtext:
          "Pore: r941, Instrument: minION or gridION, Basecaller Method: High, Version: g/360",
      },
    ],
  },
  MINION_GRIDION: {
    displayName: "minION or gridION",
    options: [
      {
        text: "r941_min_fast_g303",
        value: "r941_min_fast_g303",
        subtext:
          "Pore: r941, Instrument: minION or gridION, Basecaller Method: Fast, Version: g/303",
      },
      {
        text: "r941_min_high_g303",
        value: "r941_min_high_g303",
        subtext:
          "Pore: r941, Instrument: minION or gridION, Basecaller Method: High, Version: g/303",
      },
      {
        text: "r941_min_high_g330",
        value: "r941_min_high_g330",
        subtext:
          "Pore: r941, Instrument: minION or gridION, Basecaller Method: High, Version: g/330",
      },
      {
        text: "r941_min_high_g340_rle",
        value: "r941_min_high_g340_rle",
        subtext:
          "Pore: r941, Instrument: minION or gridION, Basecaller Method: High, Version: g/340",
      },
      {
        text: "r941_min_high_g344",
        value: "r941_min_high_g344",
        subtext:
          "Pore: r941, Instrument: minION or gridION, Basecaller Method: High, Version: g/344",
      },
      {
        text: "r941_min_high_g351",
        value: "r941_min_high_g351",
        subtext:
          "Pore: r941, Instrument: minION or gridION, Basecaller Method: High, Version: g/351",
      },
    ],
  },
  PROMETHION: {
    displayName: "promethION",
    options: [
      {
        text: "r103_prom_high_g360",
        value: "r103_prom_high_g360",
        subtext:
          "Pore: r103, Instrument: promethION, Basecaller Method: High, Version: g/",
      },
      {
        text: "r103_prom_snp_g3210",
        value: "r103_prom_snp_g3210",
        subtext:
          "Pore: r103, Instrument: promethION, Basecaller Method: SNP, Version: g/3210",
      },
      {
        text: "r103_prom_variant_g3210",
        value: "r103_prom_variant_g3210",
        subtext:
          "Pore: r103, Instrument: promethION, Basecaller Method: Variant, Version: g/3210",
      },
      {
        text: "r941_prom_fast_g303",
        value: "r941_prom_fast_g303",
        subtext:
          "Pore: r941, Instrument: promethION, Basecaller Method: Fast, Version: g/303",
      },
      {
        text: "r941_prom_high_g303",
        value: "r941_prom_high_g303",
        subtext:
          "Pore: r941, Instrument: promethION, Basecaller Method: High, Version: g/303",
      },
      {
        text: "r941_prom_high_g330",
        value: "r941_prom_high_g330",
        subtext:
          "Pore: r941, Instrument: promethION, Basecaller Method: High, Version: g/330",
      },
      {
        text: "r941_prom_high_g344",
        value: "r941_prom_high_g344",
        subtext:
          "Pore: r941, Instrument: promethION, Basecaller Method: High, Version: g/344",
      },
      {
        text: "r941_prom_high_g360",
        value: "r941_prom_high_g360",
        subtext:
          "Pore: r941, Instrument: promethION, Basecaller Method: High, Version: g/360",
      },
      {
        text: "r941_prom_high_g4011",
        value: "r941_prom_high_g4011",
        subtext:
          "Pore: r941, Instrument: promethION, Basecaller Method: High, Version: g/4011",
      },
      {
        text: "r941_prom_snp_g303",
        value: "r941_prom_snp_g303",
        subtext:
          "Pore: r941, Instrument: promethION, Basecaller Method: SNP, Version: g/303",
      },
      {
        text: "r941_prom_snp_g322",
        value: "r941_prom_snp_g322",
        subtext:
          "Pore: r941, Instrument: promethION, Basecaller Method: SNP, Version: g/322",
      },
      {
        text: "r941_prom_snp_g360",
        value: "r941_prom_snp_g360",
        subtext:
          "Pore: r941, Instrument: promethION, Basecaller Method: SNP, Version: g/360",
      },
      {
        text: "r941_prom_variant_g303",
        value: "r941_prom_variant_g303",
        subtext:
          "Pore: r941, Instrument: promethION, Basecaller Method: Variant, Version: g/303",
      },
      {
        text: "r941_prom_variant_g322",
        value: "r941_prom_variant_g322",
        subtext:
          "Pore: r941, Instrument: promethION, Basecaller Method: Variant, Version: g/322",
      },
      {
        text: "r941_prom_variant_g360",
        value: "r941_prom_variant_g360",
        subtext:
          "Pore: r941, Instrument: promethION, Basecaller Method: Variant, Version: g/360",
      },
    ],
  },
};

export const MEGABYTE = 1000000;
export const ERROR_MESSAGE = "Error has occured";
export const SUCCESS_MESSAGE = "Success";
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
export const UNSUPPORTED_UPLOAD_OPTION_TOOLTIP =
  "This upload option is not supported for this pipeline.";
export const R1CHECK = "_R1";
export const R2CHECK = "_R2";
export const AIOLI_LIBRARIES = ["htslib/htsfile/1.10", "seqtk/1.3"];
export const LOCAL_UPLOAD = "local";
export const REMOTE_UPLOAD = "remote";
export const BASESPACE_UPLOAD = "basespace";

// TYPES
export type Technology = "Illumina" | "ONT";
export type UploadWorkflows = "mngs" | "amr" | "consensus-genome";
