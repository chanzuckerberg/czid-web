module BulkDownloadTypesHelper
  # Manual types
  CUSTOMER_SUPPORT_BULK_DOWNLOAD_TYPE = "customer_support_request".freeze

  # Common to all workflows
  SAMPLE_METADATA_BULK_DOWNLOAD_TYPE = "sample_metadata".freeze
  ORIGINAL_INPUT_FILE_BULK_DOWNLOAD_TYPE = "original_input_file".freeze

  # Specific to short read mNGS workflows
  SAMPLE_OVERVIEW_BULK_DOWNLOAD_TYPE = "sample_overview".freeze
  SAMPLE_TAXON_REPORT_BULK_DOWNLOAD_TYPE = "sample_taxon_report".freeze
  COMBINED_SAMPLE_TAXON_RESULTS_BULK_DOWNLOAD_TYPE = "combined_sample_taxon_results".freeze
  CONTIG_SUMMARY_REPORT_BULK_DOWNLOAD_TYPE = "contig_summary_report".freeze
  HOST_GENE_COUNTS_BULK_DOWNLOAD_TYPE = "host_gene_counts".freeze
  READS_NON_HOST_BULK_DOWNLOAD_TYPE = "reads_non_host".freeze
  CONTIGS_NON_HOST_BULK_DOWNLOAD_TYPE = "contigs_non_host".freeze
  UNMAPPED_READS_BULK_DOWNLOAD_TYPE = "unmapped_reads".freeze
  BIOM_FORMAT_DOWNLOAD_TYPE = "biom_format".freeze
  BETACORONOVIRUS_BULK_DOWNLOAD_TYPE = "betacoronavirus".freeze

  # Specific to consensus genome workflows
  CONSENSUS_GENOME_DOWNLOAD_TYPE = "consensus_genome".freeze
  CONSENSUS_GENOME_OVERVIEW_BULK_DOWNLOAD_TYPE = "consensus_genome_overview".freeze
  CONSENSUS_GENOME_INTERMEDIATE_OUTPUT_FILES_BULK_DOWNLOAD_TYPE = "consensus_genome_intermediate_output_files".freeze
  SEPARATE_FILES_DOWNLOAD = "Separate Files".freeze
  SINGLE_FILE_CONCATENATED_DOWNLOAD = "Single File (Concatenated)".freeze

  # Specific to antimicrobial resistance workflows
  AMR_RESULTS_BULK_DOWNLOAD = "amr_results_bulk_download".freeze
  AMR_COMBINED_RESULTS_BULK_DOWNLOAD = "amr_combined_results_bulk_download".freeze

  RESQUE_EXECUTION_TYPE = "resque".freeze
  VARIABLE_EXECUTION_TYPE = "variable".freeze
  ECS_EXECUTION_TYPE = "ecs".freeze
  # Bulk downloads of type MANUAL_UPLOAD_TYPE are not auto-generated and the kickoff function will do nothing.
  # An admin operator will need to manually upload a file to the s3 location designated by download_output_key before calling mark_success.
  # See lib/tasks/create_customer_support_download.rake.
  MANUAL_UPLOAD_TYPE = "manual".freeze

  # To help the controller return the appropriate types, we add the valid workflows for each type.
  # For types that belong to all workflows, use this constant.
  ALL_WORKFLOWS = WorkflowRun::WORKFLOW.values.freeze

  # The "type" value of the bulk download fields is really the field key.
  # There isn't currently anything that specifies what data type the field is.
  # The front-end is hard-coded to display a select dropdown or a checkbox depending on the field type.
  # For more documentation, see https://czi.quip.com/TJEaAeFaAewG/Making-a-Bulk-Download-Things-to-Know
  BULK_DOWNLOAD_TYPES = [

    # Manual types
    {
      type: CUSTOMER_SUPPORT_BULK_DOWNLOAD_TYPE,
      display_name: "Customer Support Request",
      execution_type: MANUAL_UPLOAD_TYPE,
      hide_in_creation_modal: true,
    },

    # Specific to amr workflows
    {
      type: AMR_RESULTS_BULK_DOWNLOAD,
      display_name: "Antimicrobial Resistance Results",
      file_type_display: ".tar.gz",
      description: "Includes the AMR Report, Combined AMR Metrics Summary, Contigs, Non-host reads, and raw outputs from CARD RGI. Learn More.",
      category: "reports",
      execution_type: ECS_EXECUTION_TYPE,
      workflows: [WorkflowRun::WORKFLOW[:amr]],
    },
    {
      type: AMR_COMBINED_RESULTS_BULK_DOWNLOAD,
      display_name: "Combined AMR Results",
      file_type_display: ".csv",
      description: "Primary metrics (e.g. coverage, depth) for all AMR genes in all selected samples, combined into a single file.",
      category: "reports",
      execution_type: RESQUE_EXECUTION_TYPE,
      workflows: [WorkflowRun::WORKFLOW[:amr]],
    },

    # Common to all workflows
    {
      type: SAMPLE_METADATA_BULK_DOWNLOAD_TYPE,
      display_name: "Sample Metadata",
      description: "User-uploaded metadata, including sample collection location, collection date, sample type",
      category: "reports", # to be revisited for CG downloads v1
      execution_type: RESQUE_EXECUTION_TYPE,
      file_type_display: "sample_metadata.csv",
      workflows: ALL_WORKFLOWS,
    },
    {
      type: ORIGINAL_INPUT_FILE_BULK_DOWNLOAD_TYPE,
      display_name: "Original Input Files",
      description: "Original files you submitted to CZ ID",
      category: "raw_data",
      execution_type: ECS_EXECUTION_TYPE,
      uploader_only: true,
      workflows: [WorkflowRun::WORKFLOW[:short_read_mngs], WorkflowRun::WORKFLOW[:long_read_mngs]], # for CG downloads v0
    },

    # Specific to long read mNGS workflows
    {
      type: SAMPLE_TAXON_REPORT_BULK_DOWNLOAD_TYPE,
      display_name: "Sample Taxon Reports",
      description: "Computed metrics (e.g. total bases, bPM) and metadata for each taxon identified in the sample",
      category: "reports",
      execution_type: RESQUE_EXECUTION_TYPE,
      file_type_display: ".csv",
      workflows: [WorkflowRun::WORKFLOW[:long_read_mngs]],
    },

    # Specific to short read mNGS workflows
    {
      type: SAMPLE_OVERVIEW_BULK_DOWNLOAD_TYPE,
      display_name: "Samples Overview",
      description: "Sample QC metrics (e.g. percent reads passing QC) and other summary statistics",
      category: "reports",
      execution_type: RESQUE_EXECUTION_TYPE,
      # This will be displayed in the bulk-download creation modal.
      file_type_display: ".csv",
      fields: [
        {
          display_name: "Include Metadata",
          type: "include_metadata",
          default_value: {
            value: false,
            display_name: "No",
          },
        },
      ],
      workflows: [WorkflowRun::WORKFLOW[:short_read_mngs], WorkflowRun::WORKFLOW[:long_read_mngs]],
    },
    {
      type: SAMPLE_TAXON_REPORT_BULK_DOWNLOAD_TYPE,
      display_name: "Sample Taxon Reports",
      description: "Computed metrics (e.g. total reads, rPM) and metadata for each taxon identified in the sample",
      category: "reports",
      execution_type: RESQUE_EXECUTION_TYPE,
      fields: [
        {
          display_name: "Background",
          type: "background",
        },
      ],
      file_type_display: ".csv",
      workflows: [WorkflowRun::WORKFLOW[:short_read_mngs]],
    },
    {
      type: COMBINED_SAMPLE_TAXON_RESULTS_BULK_DOWNLOAD_TYPE,
      display_name: "Combined Sample Taxon Results",
      description: "The value of a particular metric (e.g. total reads, rPM) for all taxa in all selected samples, combined into a single file",
      category: "reports",
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
      workflows: [WorkflowRun::WORKFLOW[:short_read_mngs]],
    },
    {
      type: CONTIG_SUMMARY_REPORT_BULK_DOWNLOAD_TYPE,
      display_name: "Contig Summary Reports",
      description: "Contig QC metrics (e.g. read coverage, percent identity) and other summary statistics",
      category: "reports",
      execution_type: RESQUE_EXECUTION_TYPE,
      file_type_display: ".csv",
      workflows: [WorkflowRun::WORKFLOW[:short_read_mngs], WorkflowRun::WORKFLOW[:long_read_mngs]],
    },
    {
      type: HOST_GENE_COUNTS_BULK_DOWNLOAD_TYPE,
      display_name: "Host Gene Counts",
      description: "Host gene count outputs from STAR",
      category: "reports",
      execution_type: ECS_EXECUTION_TYPE,
      admin_only: false,
      file_type_display: ".star.tab",
      workflows: [WorkflowRun::WORKFLOW[:short_read_mngs]],
    },
    {
      type: BIOM_FORMAT_DOWNLOAD_TYPE,
      display_name: "Combined Microbiome File",
      description: "Sample report data (samples x taxons) combined with all sample metadata and taxon metadata in",
      category: "reports",
      fields: [
        {
          display_name: "Download Metric",
          type: "metric",
        },
        {
          display_name: "Filter by",
          type: "filter_by",
        },
        {
          display_name: "Background",
          type: "background",
        },
      ],
      execution_type: RESQUE_EXECUTION_TYPE,
      required_allowed_feature: "microbiome",
      file_type_display: ".biom",
      workflows: [WorkflowRun::WORKFLOW[:short_read_mngs]],
    },
    {
      type: READS_NON_HOST_BULK_DOWNLOAD_TYPE,
      display_name: "Reads (Non-host)",
      description: "Reads with host data subtracted",
      category: "raw_data",
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
      workflows: [WorkflowRun::WORKFLOW[:short_read_mngs], WorkflowRun::WORKFLOW[:long_read_mngs]],
    },
    {
      # DEPRECATED:
      hide_in_creation_modal: true,
      type: BETACORONOVIRUS_BULK_DOWNLOAD_TYPE,
      display_name: "Betacoronavirus Reads (Paired, Non-Deduplicated)",
      execution_type: ECS_EXECUTION_TYPE,
    },
    {
      type: CONTIGS_NON_HOST_BULK_DOWNLOAD_TYPE,
      display_name: "Contigs (Non-host)",
      description: "Contigs with host data subtracted",
      category: "raw_data",
      fields: [
        {
          display_name: "Taxon",
          type: "taxa_with_contigs",
        },
      ],
      execution_type: VARIABLE_EXECUTION_TYPE,
      workflows: [WorkflowRun::WORKFLOW[:short_read_mngs], WorkflowRun::WORKFLOW[:long_read_mngs]],
    },
    {
      type: UNMAPPED_READS_BULK_DOWNLOAD_TYPE,
      display_name: "Unmapped Reads",
      description: "Reads that didn’t map to any taxa",
      category: "raw_data",
      execution_type: ECS_EXECUTION_TYPE,
      workflows: [WorkflowRun::WORKFLOW[:short_read_mngs], WorkflowRun::WORKFLOW[:long_read_mngs]],
    },

    # Consensus genome workflows
    {
      type: CONSENSUS_GENOME_DOWNLOAD_TYPE,
      display_name: "Consensus Genome",
      description: "Download multiple consensus genomes as separate or a single file.",
      category: "results",
      fields: [
        {
          display_name: "Download Format",
          type: "download_format",
          options: [SEPARATE_FILES_DOWNLOAD, SINGLE_FILE_CONCATENATED_DOWNLOAD],
        },
      ],
      execution_type: VARIABLE_EXECUTION_TYPE,
      file_type_display: "consensus.fa",
      workflows: [WorkflowRun::WORKFLOW[:consensus_genome]],
    },
    {
      type: CONSENSUS_GENOME_OVERVIEW_BULK_DOWNLOAD_TYPE,
      display_name: "Consensus Genome Overview",
      description: "Consensus Genome QC metrics (e.g. % genome coverage, mapped read #, SNP #) and other summary statistics",
      category: "reports",
      execution_type: RESQUE_EXECUTION_TYPE,
      # This will be displayed in the bulk-download creation modal.
      file_type_display: ".csv",
      fields: [
        {
          display_name: "Include Metadata",
          type: "include_metadata",
          default_value: {
            value: false,
            display_name: "No",
          },
        },
      ],
      workflows: [WorkflowRun::WORKFLOW[:consensus_genome]],
    },
    {
      type: CONSENSUS_GENOME_INTERMEDIATE_OUTPUT_FILES_BULK_DOWNLOAD_TYPE,
      display_name: "Intermediate Output Files",
      description: "Intermediate output files including BAM files, coverage plots, QUAST report and more.",
      category: "reports",
      execution_type: ECS_EXECUTION_TYPE,
      workflows: [WorkflowRun::WORKFLOW[:consensus_genome]],
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
