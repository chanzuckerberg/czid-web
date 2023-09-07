const DOC_BASE_LINK = "https://help.czid.org/hc/en-us/articles/";

export const SHARED_SAMPLE_TABLE_COLUMNS = {
  sample: {
    tooltip: `User-defined sample name.`,
  },
  createdAt: {
    tooltip: "Date on which the pipeline was run.",
  },
  collection_location_v2: {
    tooltip: "User-defined location from which the sample was collected.",
  },
  notes: {
    tooltip: "User-supplied notes.",
  },
  nucleotide_type: {
    tooltip:
      "User-selected metadata field indicating the nucleotide type (RNA, DNA).",
  },
  pipelineVersion: {
    tooltip: "Version of the pipeline used for the last run of the sample.",
  },
  readsLost: {
    tooltip:
      "Reads Lost:Reads filtered during each step of the pipeline. The full length of the bar represents the Total Reads. Passed Filters represent the reads that passed quality control and filtering steps. Learn more.",
    link: "https://chanzuckerberg.zendesk.com/hc/en-us/articles/360053758913-Sample-QC#Reads-Lost",
  },
  sample_type: {
    tooltip: "User-supplied metadata field indicating the sample type.",
  },
  totalRuntime: {
    tooltip: `Total time required by the CZ ID pipeline to process .fastq files into
    CZ ID reports.`,
  },
  water_control: {
    tooltip: "Whether a sample is water-only as a control.",
  },
};

export const SHORT_READ_MNGS_SAMPLE_TABLE_COLUMNS = {
  host: {
    tooltip: `User-selected organism from which the sample was collected. It dictates which genome is used for host subtraction.`,
    link: DOC_BASE_LINK + "360035296613-Project-Page#metrics-meanings",
  },
  totalReads: {
    tooltip:
      "Total number of reads uploaded. For paired-end data, each R1 and R2 read counts as one read.",
    link: DOC_BASE_LINK + "360053758913-Sample-QC#Total-Reads",
    testid: "total-read-info-icon",
  },
  nonHostReads: {
    tooltip: `Reads remaining after QC filtering and removal of host and human reads. Values for pipeline v8.0 and up reflect reads remaining after subsampling.`,
    link: DOC_BASE_LINK + "360034790554-Pipeline-Details#passed-filters",
  },
  qcPercent: {
    tooltip: `Percentage of reads remaining after QC filtering to remove low quality bases, short reads, and low complexity reads.`,
    link: DOC_BASE_LINK + "360053758913-Sample-QC#Passed-QC",
    testid: "passed-qc-info-icon",
  },
  duplicateCompressionRatio: {
    tooltip: `Duplicate Compression Ratio is the ratio of the number of reads passing QC filtering and host/human read removal to the number of unique reads after duplicate removal.`,
    link:
      DOC_BASE_LINK +
      "360053758913-Sample-QC#DCR-(duplicate-compression-ratio)",
    testid: "duplicate-compression-ratio-tooltip",
  },
  erccReads: {
    tooltip: `Total number of reads aligning to ERCC (External RNA Controls Consortium) sequences.`,
    link: DOC_BASE_LINK + "360034790834-How-to-Interpret-ERCC-Quality",
  },
  meanInsertSize: {
    tooltip:
      "Average length of the nucleotide sequence that is inserted between sequencing adapters.",
    link: DOC_BASE_LINK + "360053758913-Sample-QC#Mean-Insert-Size",
    testid: "mean-insert-size-title",
  },
  subsampledFraction: {
    tooltip: `After QC filtering and host/human data removal, the remaining reads are subsampled to1M (single-end) or 2M (paired-end) reads. This field reflects the ratio of subsampled reads to total reads passing QC filtering and host/human read removal steps.`,
    link: DOC_BASE_LINK + "360035296613-Project-Page#metrics-meanings",
  },
};

export const LONG_READ_MNGS_SAMPLE_TABLE_COLUMNS = {
  host: {
    tooltip: `User-selected organism from which this sample was collected. 
    Dictates which genome is used for host subtraction.`,
  },
  totalReads: {
    tooltip: "Total number of reads uploaded.",
  },
  nonHostReads: {
    tooltip: `Percentage of reads remaining after QC filtering (fastp),
    removing host and human reads (minimap2), and subsampling to 1 million reads.`,
  },
  qcPercent: {
    tooltip: `Percentage of reads remaining after QC filtering (fastp) to remove
    low quality bases, short reads, and low complexity reads.`,
  },
  duplicateCompressionRatio: {
    tooltip: `Duplicate Compression Ratio (DCR) is not calculated for Nanopore.`,
  },
  erccReads: {
    tooltip: `Total number of reads aligning to ERCC (External RNA Controls Consortium) spike-in controls
    is not calculated for Nanopore.`,
  },
  meanInsertSize: {
    tooltip: "Mean insert size is not calculated for Nanopore.",
  },
  subsampledFraction: {
    tooltip: `After QC filtering and host/human data removal, the remaining reads are subsampled to 1 million. 
    This field reflects the ratio of subsampled reads to total reads passing QC filtering and host/human data removal.`,
  },
};

export const BACKGROUND_CORRECTION_METHODS = {
  standard: {
    value: "standard",
    text: "Standard",
    subtext:
      "For samples without ERCCs, background correction done using relative abundances.",
  } as CorrectionMethod,
  massNormalized: {
    value: "massNormalized",
    text: "Normalized by input mass",
    subtext:
      "For samples with ERCCs, background correction done using estimates of relative microbe mass.",
  } as CorrectionMethod,
};

export const PROHIBITED_BACKGROUND_MODEL_NAMES = new Set(["none"]);

export enum SampleUploadErrors {
  BASESPACE_UPLOAD_FAILED = "BASESPACE_UPLOAD_FAILED",
  S3_UPLOAD_FAILED = "S3_UPLOAD_FAILED",
  MAX_FILE_SIZE_EXCEEDED = "MAX_FILE_SIZE_EXCEED",
  LOCAL_UPLOAD_STALLED = "LOCAL_UPLOAD_STALLED",
  LOCAL_UPLOAD_FAILED = "LOCAL_UPLOAD_FAILED",
  PIPELINE_KICKOFF = "PIPELINE_KICKOFF_FAILED",
  DO_NOT_PROCESS = "DO_NOT_PROCESS",
}

export const FINALIZED_SAMPLE_UPLOAD_ERRORS = [
  SampleUploadErrors.BASESPACE_UPLOAD_FAILED,
  SampleUploadErrors.S3_UPLOAD_FAILED,
  SampleUploadErrors.MAX_FILE_SIZE_EXCEEDED,
  SampleUploadErrors.LOCAL_UPLOAD_FAILED,
  SampleUploadErrors.PIPELINE_KICKOFF,
  SampleUploadErrors.DO_NOT_PROCESS,
];

interface CorrectionMethod {
  value: string;
  text: string;
  subtext: string;
  tooltip?: string;
  disabled: boolean;
}
