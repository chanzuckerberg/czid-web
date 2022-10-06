module Types
  class SampleDetailsType < Types::BaseObject
    field :dbSample, Types::DbSampleType, null: true
    field :metadata, Types::SampleMetadataType, null: true
    field :derivedSampleOutput, Types::DerivedSampleOutputType, null: true
    field :uploader, Types::SampleUploaderType, null: false
    field :mngsRunInfo, Types::MngsRunInfoType, null: true
    field :workflowRunsCountByWorkflow, String, null: true
  end

  class SampleType < Types::BaseObject
    field :id, Int, null: false
    field :name, String, null: false
    field :created_at, GraphQL::Types::ISO8601DateTime, null: true
    field :updated_at, GraphQL::Types::ISO8601DateTime, null: true
    field :private_until, GraphQL::Types::ISO8601DateTime, null: true
    field :project_id, Int, null: true
    field :status, String, null: true
    field :sample_notes, String, null: true
    field :s3_preload_result_path, String, null: true
    field :s3_star_index_path, String, null: true
    field :s3_bowtie2_index_path, String, null: true
    field :host_genome_id, Int, null: true
    field :user_id, Int, null: true
    field :subsample, Int, null: true
    field :pipeline_branch, String, null: true
    field :alignment_config_name, String, null: true
    field :web_commit, String, null: true
    field :pipeline_commit, String, null: true
    field :dag_vars, String, null: true
    field :max_input_fragments, Int, null: true
    field :uploaded_from_basespace, Int, null: true
    field :upload_error, String, null: true
    field :basespace_access_token, String, null: true
    field :do_not_process, Boolean, null: false
    field :pipeline_execution_strategy, String, null: true
    field :use_taxon_whitelist, Boolean, null: false
    field :initial_workflow, String, null: false
    field :public, Int, null: false
    field :details, Types::SampleDetailsType, null: false
  end

  # TODO: populate this class. It returns a non consistent set of
  # keys unlike other types. It is not needed for this endpoint
  # but will need to be addressed.
  # class WorkflowRunsCountByWorkflowType < Types::BaseObject
  # end

  class SampleListType < Types::BaseObject
    field :samples, [Types::SampleType], null: false
    field :sampleIds, [Int], null: true

    def self.authorized?(object, context)
      super && current_user_is_logged_in?(context)
    end
  end
end
