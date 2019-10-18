module BulkDownloadTypesHelper
  BULK_DOWNLOAD_TYPES = [
    {
      type: "sample_overview",
      display_name: "Sample Overview",
      description: "Sample metadata and QC metrics",
      category: "report",
    },
    {
      type: "sample_taxon_report",
      display_name: "Sample Taxon Report",
      description: "Metrics (e.g. total reads, rPM) and metadata for each taxon identified in the sample",
      category: "report",
    },
    {
      type: "combined_sample_taxon_results",
      display_name: "Combined Sample Taxon Results",
      description: "The value of a particular metric (e.g. total reads, rPM) for all taxons in all selected samples, in a single data table",
      category: "report",
      fields: [
        {
          display_name: "File Format",
          type: "file_format",
          options: [".csv", ".biom"],
        },
      ],
    },
    {
      type: "contig_summary_report",
      display_name: "Contig Summary Report",
      description: "Contig metadata and QC metrics",
      category: "report",
    },
    {
      type: "host_gene_counts",
      display_name: "Host Gene Counts",
      description: "Host gene count output from STAR",
      category: "report",
    },
    {
      type: "reads_non_host",
      display_name: "Reads (Non-host)",
      description: "Reads with host data subtracted",
      category: "raw",
    },
    {
      type: "contigs_non_host",
      display_name: "Contigs (Non-host)",
      description: "Contigs with host data subtracted",
      category: "raw",
    },
    {
      type: "unmapped_reads",
      display_name: "Unmapped Reads",
      description: "Reads that didn’t map to any taxa",
      category: "raw",
    },
    {
      type: "original_input_file",
      display_name: "Original Input File",
      description: "Original file you submitted to IDseq",
      category: "raw",
    },
  ].freeze

  # A hash of type => display_name.
  BULK_DOWNLOAD_TYPE_TO_DISPLAY_NAME = Hash[
    BULK_DOWNLOAD_TYPES.pluck(:type).zip(BULK_DOWNLOAD_TYPES.pluck(:display_name))
  ]
end
