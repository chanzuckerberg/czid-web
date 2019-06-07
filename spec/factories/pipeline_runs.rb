FactoryBot.define do
  factory :pipeline_run, class: PipelineRun do
    transient do
      # Array of taxon_counts entries to create.
      # The hash elements will be passed on to taxon_count factory as keyword arguments.
      taxon_counts_data { [] }
      # Array of pipeline_run_stage entries to create.
      # The hash elements will be passed on to pipeline_run_stage factory as keyword arguments.
      pipeline_run_stages_data { [] }
    end

    alignment_config { create(:alignment_config) }

    after :create do |pipeline_run, options|
      options.taxon_counts_data.each do |taxon_count_data|
        create(:taxon_count, pipeline_run: pipeline_run, **taxon_count_data)
      end

      pipeline_run.pipeline_run_stages = []
      options.pipeline_run_stages_data.each do |pipeline_run_stage_data|
        create(:pipeline_run_stage, pipeline_run: pipeline_run, **pipeline_run_stage_data)
      end
    end
  end
end
