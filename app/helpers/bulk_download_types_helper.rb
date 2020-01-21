module BulkDownloadTypesHelper
  SAMPLE_OVERVIEW_BULK_DOWNLOAD_TYPE = "sample_overview".freeze
  SAMPLE_TAXON_REPORT_BULK_DOWNLOAD_TYPE = "sample_taxon_report".freeze
  COMBINED_SAMPLE_TAXON_RESULTS_BULK_DOWNLOAD_TYPE = "combined_sample_taxon_results".freeze
  CONTIG_SUMMARY_REPORT_BULK_DOWNLOAD_TYPE = "contig_summary_report".freeze
  HOST_GENE_COUNTS_BULK_DOWNLOAD_TYPE = "host_gene_counts".freeze
  READS_NON_HOST_BULK_DOWNLOAD_TYPE = "reads_non_host".freeze
  CONTIGS_NON_HOST_BULK_DOWNLOAD_TYPE = "contigs_non_host".freeze
  UNMAPPED_READS_BULK_DOWNLOAD_TYPE = "unmapped_reads".freeze
  ORIGINAL_INPUT_FILE_BULK_DOWNLOAD_TYPE = "original_input_file".freeze

  RESQUE_EXECUTION_TYPE = "resque".freeze
  VARIABLE_EXECUTION_TYPE = "variable".freeze
  ECS_EXECUTION_TYPE = "ecs".freeze

  BULK_DOWNLOAD_TYPES = [
    {
      type: SAMPLE_OVERVIEW_BULK_DOWNLOAD_TYPE,
      display_name: "Samples Overview",
      description: "Sample QC metrics (e.g. percent reads passing QC) and other summary statistics",
      category: "report",
      execution_type: RESQUE_EXECUTION_TYPE,
      # This will be displayed in the bulk-download creation modal.
      file_type_display: ".csv",
    },
    {
      type: SAMPLE_TAXON_REPORT_BULK_DOWNLOAD_TYPE,
      display_name: "Sample Taxon Reports",
      description: "Computed metrics (e.g. total reads, rPM) and metadata for each taxon identified in the sample",
      category: "report",
      execution_type: RESQUE_EXECUTION_TYPE,
      fields: [
        {
          display_name: "Background",
          type: "background",
        },
      ],
      file_type_display: ".csv",
    },
    {
      type: COMBINED_SAMPLE_TAXON_RESULTS_BULK_DOWNLOAD_TYPE,
      display_name: "Combined Sample Taxon Results",
      description: "The value of a particular metric (e.g. total reads, rPM) for all taxa in all selected samples, combined into a single file",
      category: "report",
      fields: [
        {
          display_name: "Metric",
          type: "metric",
        },
        {
          display_name: "Background",
          type: "background",
        },
      ],
      execution_type: RESQUE_EXECUTION_TYPE,
      file_type_display: ".csv",
    },
    {
      type: CONTIG_SUMMARY_REPORT_BULK_DOWNLOAD_TYPE,
      display_name: "Contig Summary Reports",
      description: "Contig QC metrics (e.g. read coverage, percent identity) and other summary statistics",
      category: "report",
      execution_type: RESQUE_EXECUTION_TYPE,
      file_type_display: ".csv",
    },
    {
      type: HOST_GENE_COUNTS_BULK_DOWNLOAD_TYPE,
      display_name: "Host Gene Counts",
      description: "Host gene count outputs from STAR",
      category: "report",
      execution_type: ECS_EXECUTION_TYPE,
      admin_only: true,
      file_type_display: ".star.tab",
    },
    {
      type: READS_NON_HOST_BULK_DOWNLOAD_TYPE,
      display_name: "Reads (Non-host)",
      description: "Reads with host data subtracted",
      category: "raw",
      fields: [
        {
          display_name: "Taxon",
          type: "taxa_with_reads",
        },
        {
          display_name: "File Format",
          type: "file_format",
          options: [".fasta", ".fastq"],
        },
      ],
      execution_type: VARIABLE_EXECUTION_TYPE,
    },
    {
      type: CONTIGS_NON_HOST_BULK_DOWNLOAD_TYPE,
      display_name: "Contigs (Non-host)",
      description: "Contigs with host data subtracted",
      category: "raw",
      fields: [
        {
          display_name: "Taxon",
          type: "taxa_with_contigs",
        },
      ],
      execution_type: VARIABLE_EXECUTION_TYPE,
    },
    {
      type: UNMAPPED_READS_BULK_DOWNLOAD_TYPE,
      display_name: "Unmapped Reads",
      description: "Reads that didn’t map to any taxa",
      category: "raw",
      execution_type: ECS_EXECUTION_TYPE,
    },
    {
      type: ORIGINAL_INPUT_FILE_BULK_DOWNLOAD_TYPE,
      display_name: "Original Input Files",
      description: "Original files you submitted to IDseq",
      category: "raw",
      execution_type: ECS_EXECUTION_TYPE,
      uploader_only: true,
    },
  ].freeze

  # A hash of type name => type object
  BULK_DOWNLOAD_TYPE_NAME_TO_DATA = Hash[
    BULK_DOWNLOAD_TYPES.pluck(:type).zip(BULK_DOWNLOAD_TYPES)
  ]

  def self.bulk_download_types
    BULK_DOWNLOAD_TYPES
  end

  def self.bulk_download_type(type_name)
    BULK_DOWNLOAD_TYPE_NAME_TO_DATA[type_name]
  end

  def self.bulk_download_type_display_name(type_name)
    BULK_DOWNLOAD_TYPE_NAME_TO_DATA[type_name][:display_name]
  end
end
