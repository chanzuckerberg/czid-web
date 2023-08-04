# Collect samples with latest amr run workflow versions 1.0.0 to 1.2.14
# Get s3 output directories for the latest workflow run
# Collect s3 locations for contigs.fasta and comprehensive_AMR_metrics.tsv
# Run backfill wdl workflow with sample contigs and final report s3 locations
#   as input and same s3 output directory as latest workflow run
# The backfill job will, for each workflow run:
# => Copy contig_amr_report.sorted.bam to contig_amr_report.sorted.bam.pre-1-2-15
# => Copy contig_amr_report.sorted.bam.bai to contig_amr_report.sorted.bam.bai.pre-1-2-15
# => Download the final summary tsv and contigs fasta
# => Run the updated task to create the contigs bam/bai files
# => Overwrite the old files on s3 with the newly generated ones
# The backfill job will upload a log with list and count of samples processed when done

desc "Backfills AMR sorted contigs.bam/bai files from workflow versions <=1.2.14 to the 1.2.15 equivalent."
task :backfill_amr_contigs_bam, [:docker_image_id, :wdl_uri, :min_version, :max_version] => :environment do |_, args|
  # prevent constants from polluting the rest of the rails namespace
  MIN_WDL_VERSION = args[:min_version].freeze
  MAX_WDL_VERSION = args[:max_version].freeze
  raise ":min_version and :max_version required" if MIN_WDL_VERSION.blank? || MAX_WDL_VERSION.blank?

  BATCH_SIZE = 500

  TIMESTAMP = Time.zone.now.strftime('%Y%m%d%H%M%S')

  ## Find distinct wdl versions
  versions = WorkflowRun.where(workflow: WorkflowRun::WORKFLOW[:amr]).distinct.pluck(:wdl_version)
  backfill_versions = versions.compact.select do |num|
    Gem::Version.new(num) >= Gem::Version.new(MIN_WDL_VERSION) && Gem::Version.new(num) <= Gem::Version.new(MAX_WDL_VERSION)
  end

  ## Batch process workflows. Get workflow ids, s3 locations
  no_path_workflows = []
  backfill_workflows = []
  WorkflowRun
    .where(
      {
        workflow: WorkflowRun::WORKFLOW[:amr],
        wdl_version: backfill_versions,
        status: WorkflowRun::STATUS[:succeeded],
      }
    )
    .in_batches(of: BATCH_SIZE)
    .each_record do |workflow_run|
      begin # rubocop:disable Style/RedundantBegin
        # get s3 paths for files we're touching on
        s3_path_bam = workflow_run.output_path(AmrWorkflowRun::OUTPUT_CONTIGS_BAM)
        s3_path_bai = workflow_run.output_path(AmrWorkflowRun::OUTPUT_CONTIGS_BAI)
        s3_path_contigs = workflow_run.output_path(AmrWorkflowRun::OUTPUT_NON_HOST_CONTIGS)
        s3_path_summary = workflow_run.output_path(AmrWorkflowRun::OUTPUT_COMPREHENSIVE_AMR_METRICS_TSV)

        # add data to backfill_workflows
        backfill_workflows << {
          "final_summary" => s3_path_summary,
          "contigs" => s3_path_contigs,
          "sorted_bam" => s3_path_bam,
          "bai_index" => s3_path_bai,
          "id" => workflow_run.id,
        }
      # Handle samples/workflow runs with missing s3 paths
      rescue StandardError
        no_path_workflows << workflow_run.id
        next
      end
    end

  ## Create sfn input json for each workflow and dispatch job
  sfn_arn = AppConfigHelper.get_app_config(AppConfig::SFN_SINGLE_WDL_ARN) || AppConfigHelper.get_app_config(AppConfig::SFN_AMR_ARN)
  raise SfnArnMissingError if sfn_arn.blank?

  backfill_data = backfill_workflows.to_json
  backfill_data_key = "backfill/amr-contigs-bam/#{TIMESTAMP}/backfill_data.json"
  AwsClient[:s3].put_object(bucket: SAMPLES_BUCKET_NAME, key: backfill_data_key, body: backfill_data)

  run_inputs = {
    backfill_data: "s3://#{SAMPLES_BUCKET_NAME}/#{backfill_data_key}",
    docker_image_id: args[:docker_image_id],
  }

  sfn_input_hash = {
    RUN_WDL_URI: args[:wdl_uri],
    Input: {
      Run: run_inputs,
    },
    OutputPrefix: "s3://#{SAMPLES_BUCKET_NAME}/backfill/amr-contigs-bam/#{TIMESTAMP}",
  }

  sfn_input = JSON.dump(sfn_input_hash)

  sfn_name = "idseq-#{Rails.env}-contigs-bam-bai-backfill-#{TIMESTAMP}"
  AwsClient[:states].start_execution(state_machine_arn: sfn_arn, name: sfn_name, input: sfn_input)

  ## Upload log and count of workflows we couldn't process
  no_path_log = no_path_workflows.to_json
  no_path_log_key = "/backfill/amr-contigs-bam/#{TIMESTAMP}/no_path.log"
  no_path_count = no_path_workflows.length.to_s
  no_path_count_key = "/backfill/amr-contigs-bam/#{TIMESTAMP}/no_path_count.log"
  AwsClient[:s3].put_object(bucket: SAMPLES_BUCKET_NAME, key: no_path_log_key, body: no_path_log)
  AwsClient[:s3].put_object(bucket: SAMPLES_BUCKET_NAME, key: no_path_count_key, body: no_path_count)
end
