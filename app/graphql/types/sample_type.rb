module Types
  class SampleType < Types::BaseObject
    field :name, String, null: false
    field :created_at, GraphQL::Types::ISO8601DateTime, null: false
    field :updated_at, GraphQL::Types::ISO8601DateTime, null: false
    field :project_id, Integer, null: true
    field :status, String, null: true
    field :sample_notes, String, null: true
    field :s3_preload_result_path, String, null: true
    field :s3_star_index_path, String, null: true
    field :s3_bowtie2_index_path, String, null: true
    field :host_genome_id, Integer, null: true
    field :user_id, Integer, null: true
    field :subsample, Integer, null: true
    field :pipeline_branch, String, null: true
    field :alignment_config_name, String, null: true
    field :web_commit, String, null: true
    field :pipeline_commit, String, null: true
    field :dag_vars, String, null: true
    field :max_input_fragments, Integer, null: true
    field :uploaded_from_basespace, Integer, null: true
    field :upload_error, String, null: true
    field :basespace_access_token, String, null: true
    field :do_not_process, Boolean, null: false
    field :pipeline_execution_strategy, String, null: true
    field :use_taxon_whitelist, Boolean, null: false
    field :initial_workflow, String, null: false
  end
end
