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
      "Reads filtered during each step of the pipeline. The full length of the bar represents the Total Reads. Passed Filters represent the reads that passed quality control and filtering steps.",
    link: DOC_BASE_LINK + "360053758913-Sample-QC#Reads-Lost",
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
    tooltip: `User-selected organism from which this sample was collected; this
      value is selected by the user at sample upload and dictates which
      genomes are used for initial host subtraction pipeline steps.`,
    link: DOC_BASE_LINK + "360035296613-Project-Page#metrics-meanings",
  },
  totalReads: {
    tooltip:
      "The total number of single-end reads uploaded. Each end of the paired-end reads count as one read.",
    link: DOC_BASE_LINK + "360053758913-Sample-QC#Total-Reads",
  },
  nonHostReads: {
    tooltip: `The percentage of reads that came out of step (8) of the host filtration
    and QC steps as compared to what went in at step (1).`,
    link: DOC_BASE_LINK + "360034790554-Pipeline-Details#passed-filters",
  },
  qcPercent: {
    tooltip: `The percentage of reads that came out of PriceSeq, step (3) of the host
    filtration and QC steps, compared to what went into Trimmomatic, step (2).`,
    link: DOC_BASE_LINK + "360053758913-Sample-QC#Passed-QC",
  },
  duplicateCompressionRatio: {
    tooltip: `Duplicate Compression Ratio is the ratio of the total number of
    sequences present prior to running czid-dedup (duplicate identification) vs
    the number of unique sequences.`,
    link:
      DOC_BASE_LINK +
      "360053758913-Sample-QC#DCR-(duplicate-compression-ratio)",
  },
  erccReads: {
    tooltip: `The total number of reads aligning to ERCC (External RNA Controls
      Consortium) sequences.`,
    link: DOC_BASE_LINK + "360034790834-How-to-Interpret-ERCC-Quality",
  },
  meanInsertSize: {
    tooltip:
      "The average length of the nucleotide sequence that is inserted between the adapters.",
    link: DOC_BASE_LINK + "360053758913-Sample-QC#Mean-Insert-Size",
  },
  subsampledFraction: {
    tooltip: `After host filtration and QC, the remaining reads are subsampled to 1
    million fragments (2 million paired reads). This field indicates the ratio of
    subsampled reads to total reads passing host filtration and QC steps.`,
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
    removing host and human reads (minimap2), and subsampling to 100,000 reads.`,
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
    tooltip: `After QC filtering and host/human data removal, the remaining reads are subsampled to 100,000. 
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

interface CorrectionMethod {
  value: string;
  text: string;
  subtext: string;
  tooltip?: string;
  disabled: boolean;
}
