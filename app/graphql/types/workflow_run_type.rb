module Types
  class WorkflowRunType < Types::BaseObject
    field :sample_id, Int, null: true
    field :created_at, GraphQL::Types::ISO8601DateTime, null: false
    field :updated_at, GraphQL::Types::ISO8601DateTime, null: false
    field :job_status, String, null: true
    field :finalized, Int, null: false
    field :total_reads, Int, null: true
    field :adjusted_remaining_reads, Int, null: true
    field :unmapped_reads, Int, null: true
    field :subsample, Int, null: true
    field :pipeline_branch, String, null: true
    field :total_ercc_reads, Int, null: true
    field :fraction_subsampled, Float, null: true
    field :pipeline_version, String, null: true
    field :pipeline_commit, String, null: true
    field :truncated, Int, null: true
    field :results_finalized, Int, null: true
    field :alignment_config_id, Int, null: true
    field :alert_sent, Int, null: true
    field :dag_vars, String, null: true
    field :assembled, Int, null: true
    field :max_input_fragments, Int, null: true
    field :error_message, String, null: true
    field :known_user_error, String, null: true
    field :pipeline_execution_strategy, String, null: false
    field :sfn_execution_arn, String, null: true
    field :use_taxon_whitelist, Boolean, null: false
    field :wdl_version, String, null: true
    field :s3_output_prefix, String, null: true
    field :executed_at, GraphQL::Types::ISO8601DateTime, null: true
    field :time_to_finalized, Int, null: true
    field :time_to_results_finalized, Int, null: true
    field :qc_percent, Float, null: true
    field :compression_ratio, Float, null: true
  end
end
