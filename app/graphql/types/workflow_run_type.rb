module Types
  class WorkflowRunType < Types::BaseObject
    field :sample_id, Int, null: true
    field :status, String, null: false
    field :workflow, String, null: false
    field :wdl_version, String, null: true
    field :sfn_execution_arn, String, null: true
    field :executed_at, GraphQL::Types::ISO8601DateTime, null: true
    field :deprecated, Boolean, null: false
    field :created_at, GraphQL::Types::ISO8601DateTime, null: false
    field :updated_at, GraphQL::Types::ISO8601DateTime, null: false
    field :rerun_from, Int, null: true
    field :cached_results, String, null: true
    field :inputs_json, String, null: true
    field :s3_output_prefix, String, null: true
    field :time_to_finalized, Integer, null: true
    field :error_message, String, null: true

    field :sample, Types::SampleType, null: true, resolver_method: :workflow_run_type_sample
    def workflow_run_type_sample
      object.sample
    end
  end
end
