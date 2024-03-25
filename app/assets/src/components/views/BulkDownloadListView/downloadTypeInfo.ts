const SAMPLE_METADATA_BULK_DOWNLOAD_TYPE = "sample_metadata";
const ORIGINAL_INPUT_FILE_BULK_DOWNLOAD_TYPE = "original_input_file";

const SAMPLE_OVERVIEW_BULK_DOWNLOAD_TYPE = "sample_overview";
const SAMPLE_TAXON_REPORT_BULK_DOWNLOAD_TYPE = "sample_taxon_report";
const COMBINED_SAMPLE_TAXON_RESULTS_BULK_DOWNLOAD_TYPE =
  "combined_sample_taxon_results";
const CONTIG_SUMMARY_REPORT_BULK_DOWNLOAD_TYPE = "contig_summary_report";

const AMR_RESULTS_BULK_DOWNLOAD = "amr_results_bulk_download";
const AMR_COMBINED_RESULTS_BULK_DOWNLOAD = "amr_combined_results_bulk_download";
const AMR_CONTIGS_BULK_DOWNLOAD = "amr_contigs_bulk_download";

const CONSENSUS_GENOME_DOWNLOAD_TYPE = "consensus_genome";
const CONSENSUS_GENOME_INTERMEDIATE_OUTPUT_FILES_BULK_DOWNLOAD_TYPE =
  "consensus_genome_intermediate_output_files";
const SEPARATE_FILES_DOWNLOAD = "Separate Files";
const SINGLE_FILE_CONCATENATED_DOWNLOAD = "Single File (Concatenated)";
const SEPARATE_FILES_DOWNLOAD_VALUE = "zip";
const SINGLE_FILE_CONCATENATED_DOWNLOAD_VALUE = "concatenate";

const HOST_GENE_COUNTS_BULK_DOWNLOAD_TYPE = "host_gene_counts";
const CONTIGS_NON_HOST_BULK_DOWNLOAD_TYPE = "contigs_non_host";
const READS_NON_HOST_BULK_DOWNLOAD_TYPE = "reads_non_host";
const UNMAPPED_READS_BULK_DOWNLOAD_TYPE = "unmapped_reads";
const BIOM_FORMAT_DOWNLOAD_TYPE = "biom_format";

const CUSTOMER_SUPPORT_BULK_DOWNLOAD_TYPE = "customer_support_request";

export const BULK_DOWNLOAD_TYPE_INFO = {
  // Common Download Types to all Workflows
  [SAMPLE_METADATA_BULK_DOWNLOAD_TYPE]: {
    type: SAMPLE_METADATA_BULK_DOWNLOAD_TYPE,
    displayName: "Sample Metadata",
    description:
      "User-uploaded metadata, including sample collection location, collection date, sample type",
    fileTypeDisplay: "sample_metadata.csv",
  },
  [ORIGINAL_INPUT_FILE_BULK_DOWNLOAD_TYPE]: {
    type: ORIGINAL_INPUT_FILE_BULK_DOWNLOAD_TYPE,
    displayName: "Original Input Files",
    description: "Original files you submitted to CZ ID",
  },
  // Short Read mNGS Download Types
  [SAMPLE_OVERVIEW_BULK_DOWNLOAD_TYPE]: {
    type: SAMPLE_OVERVIEW_BULK_DOWNLOAD_TYPE,
    displayName: "Samples Overview",
    description:
      "Sample QC metrics (e.g. percent reads passing QC) and other summary statistics",
    fileTypeDisplay: ".csv",
    fields: [
      {
        displayName: "Include Metadata",
        type: "include_metadata",
        default_value: {
          value: false,
          displayName: "No",
        },
      },
    ],
  },
  [CONTIG_SUMMARY_REPORT_BULK_DOWNLOAD_TYPE]: {
    type: CONTIG_SUMMARY_REPORT_BULK_DOWNLOAD_TYPE,
    displayName: "Contig Summary Reports",
    description:
      "Contig QC metrics (e.g. read coverage, percent identity) and other summary statistics",
    category: "reports",
    fileTypeDisplay: ".csv",
  },
  [HOST_GENE_COUNTS_BULK_DOWNLOAD_TYPE]: {
    type: HOST_GENE_COUNTS_BULK_DOWNLOAD_TYPE,
    displayName: "Host Gene Counts",
    description:
      "Host transcript counts (pipeline versions 8 and greater); Host gene counts (pipeline versions less than 8)",
  },
  [BIOM_FORMAT_DOWNLOAD_TYPE]: {
    type: BIOM_FORMAT_DOWNLOAD_TYPE,
    displayName: "Combined Microbiome File",
    description:
      "Sample report data (samples x taxons) combined with all sample metadata and taxon metadata in",
    category: "reports",
    fields: [
      {
        displayName: "Download Metric",
        type: "metric",
      },
      {
        displayName: "Filter by",
        type: "filter_by",
      },
      {
        displayName: "Background",
        type: "background",
      },
    ],
    required_allowed_feature: "microbiome",
    fileTypeDisplay: ".biom",
  },
  [CONTIGS_NON_HOST_BULK_DOWNLOAD_TYPE]: {
    type: CONTIGS_NON_HOST_BULK_DOWNLOAD_TYPE,
    displayName: "Contigs (Non-host)",
    description: "Contigs with host data subtracted",
    category: "raw_data",
    fields: [
      {
        displayName: "Taxon",
        type: "taxa_with_contigs",
      },
    ],
  },
  [READS_NON_HOST_BULK_DOWNLOAD_TYPE]: {
    type: READS_NON_HOST_BULK_DOWNLOAD_TYPE,
    displayName: "Reads (Non-host)",
    description: "Reads with host data subtracted",
    category: "raw_data",
    fields: [
      {
        displayName: "Taxon",
        type: "taxa_with_reads",
      },
      {
        displayName: "File Format",
        type: "file_format",
        options: [".fasta", ".fastq"],
      },
    ],
  },
  [UNMAPPED_READS_BULK_DOWNLOAD_TYPE]: {
    type: UNMAPPED_READS_BULK_DOWNLOAD_TYPE,
    displayName: "Unmapped Reads",
    description: "Reads that did not map to any taxa",
    category: "raw_data",
  },
  // Short Read mNGS & Long Read mNGS Download Types
  [SAMPLE_TAXON_REPORT_BULK_DOWNLOAD_TYPE]: {
    type: SAMPLE_TAXON_REPORT_BULK_DOWNLOAD_TYPE,
    displayName: "Sample Taxon Reports",
    description:
      "Computed metrics (e.g. total reads, rPM) and metadata for each taxon identified in the sample",
    category: "reports",
    fields: [
      {
        displayName: "Background",
        type: "background",
      },
    ],
    fileTypeDisplay: ".csv",
  },
  [COMBINED_SAMPLE_TAXON_RESULTS_BULK_DOWNLOAD_TYPE]: {
    type: COMBINED_SAMPLE_TAXON_RESULTS_BULK_DOWNLOAD_TYPE,
    displayName: "Combined Sample Taxon Results",
    description:
      "The value of a particular metric (e.g. total reads, rPM) for all taxa in all selected samples, combined into a single file",
    fields: [
      {
        displayName: "Metric",
        type: "metric",
      },
      {
        displayName: "Background",
        type: "background",
      },
    ],
    fileTypeDisplay: ".csv",
  },
  // Consensus Genome Download Types
  [CONSENSUS_GENOME_DOWNLOAD_TYPE]: {
    type: CONSENSUS_GENOME_DOWNLOAD_TYPE,
    displayName: "Consensus Genome",
    description:
      "Download multiple consensus genomes as separate or a single file.",
    fields: [
      {
        displayName: "Download Format",
        type: "download_format",
        options: [SEPARATE_FILES_DOWNLOAD, SINGLE_FILE_CONCATENATED_DOWNLOAD],
        optionValues: {
          [SEPARATE_FILES_DOWNLOAD_VALUE]: {
            label: SEPARATE_FILES_DOWNLOAD,
            value: "zip",
          },
          [SINGLE_FILE_CONCATENATED_DOWNLOAD_VALUE]: {
            label: SINGLE_FILE_CONCATENATED_DOWNLOAD,
            value: "concatenate",
          },
        },
      },
    ],
    fileTypeDisplay: "consensus.fa",
  },
  [CONSENSUS_GENOME_INTERMEDIATE_OUTPUT_FILES_BULK_DOWNLOAD_TYPE]: {
    type: CONSENSUS_GENOME_INTERMEDIATE_OUTPUT_FILES_BULK_DOWNLOAD_TYPE,
    displayName: "Intermediate Output Files",
    description:
      "Intermediate output files including BAM files, coverage plots, QUAST report and more.",
  },
  // AMR Download Types
  [AMR_RESULTS_BULK_DOWNLOAD]: {
    type: AMR_RESULTS_BULK_DOWNLOAD,
    displayName: "Antimicrobial Resistance Results",
    fileTypeDisplay: ".tar.gz",
    description:
      "Includes AMR Report, Comprehensive AMR Metrics, intermediate files and raw outputs from CARD RGI.",
  },
  [AMR_COMBINED_RESULTS_BULK_DOWNLOAD]: {
    type: AMR_COMBINED_RESULTS_BULK_DOWNLOAD,
    displayName: "Combined AMR Results",
    fileTypeDisplay: ".csv",
    description:
      "Primary metrics (e.g. coverage, depth) for all AMR genes in all selected samples, combined into a single file.",
  },
  [AMR_CONTIGS_BULK_DOWNLOAD]: {
    type: AMR_CONTIGS_BULK_DOWNLOAD,
    displayName: "Contigs",
    description: "All contigs with host data subtracted",
  },
  // Other Download Types
  [CUSTOMER_SUPPORT_BULK_DOWNLOAD_TYPE]: {
    type: CUSTOMER_SUPPORT_BULK_DOWNLOAD_TYPE,
    displayName: "Customer Support Request",
  },
};
