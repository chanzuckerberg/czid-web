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
    field :project, Types::ProjectType, null: true
    field :default_background_id, Int, null: true
    field :host_genome, Types::HostGenomeType, null: true
    field :user, Types::UserType, null: true

    field :pipeline_runs, [Types::PipelineRunType], null: true, resolver_method: :sample_type_pipeline_runs
    def sample_type_pipeline_runs
      sample = Sample.find(object["id"])
      sample.pipeline_runs_info.map { |h| h.deep_transform_keys! { |key| key.to_s.camelize(:lower) } }
    end

    field :default_pipeline_run_id, Int, null: true, resolver_method: :sample_type_default_pipeline_run_id
    def sample_type_default_pipeline_run_id
      sample = Sample.find(object["id"])
      sample.first_pipeline_run.present? ? sample.first_pipeline_run.id : nil
    end

    field :deletable, Boolean, null: true, resolver_method: :sample_type_deletable
    def sample_type_deletable
      sample = Sample.find(object["id"])
      current_user = context[:current_user]
      sample.deletable?(current_user)
    end

    field :editable, Boolean, null: true, resolver_method: :sample_type_editable
    def sample_type_editable
      sample = Sample.find(object["id"])
      current_power = context[:current_power]
      current_power.updatable_sample?(sample)
    end

    field :workflow_runs, [Types::WorkflowRunType], null: true, resolver_method: :sample_type_workflow_runs
    def sample_type_workflow_runs
      sample = Sample.find(object["id"])
      sample.workflow_runs.non_deprecated.reverse
    end

    def self.authorized?(object, context)
      super && current_user_is_logged_in?(context)
    end
  end

  class SampleListType < Types::BaseObject
    field :samples, [Types::SampleType], null: false
    field :sampleIds, [Int], null: true

    def self.authorized?(object, context)
      super && current_user_is_logged_in?(context)
    end
  end
end
