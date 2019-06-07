FactoryBot.define do
  factory :pipeline_run, class: PipelineRun do
    transient do
      # Array of taxon_counts entries to create.
      # The hash elements will be passed on to taxon_count factory as keyword arguments.
      taxon_counts_data { [] }
      amr_counts_data { [] }
      output_states_data { [] }
    end

    alignment_config { create(:alignment_config) }

    trait :with_amr_count do
      after :create do |pipeline_run, _options|
        create(:amr_count, pipeline_run: pipeline_run)
      end
    end

    after :create do |pipeline_run, options|
      options.taxon_counts_data.each do |taxon_count_data|
        create(:taxon_count, pipeline_run: pipeline_run, **taxon_count_data)
      end
      options.amr_counts_data.each do |amr_count_data|
        create(:amr_count, pipeline_run: pipeline_run, **amr_count_data)
      end
      options.output_states_data.each do |output_states_data|
        pipeline_run.output_states.find_by(output: output_states_data[:output]).update(state: output_states_data[:state])
      end
    end
  end
end
