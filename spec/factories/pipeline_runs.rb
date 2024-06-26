FactoryBot.define do
  factory :pipeline_run, class: PipelineRun do
    association :sample
    pipeline_version { 1.0 }

    transient do
      # Arrays of entries to create for their respective properties:
      # taxon_counts, amr_counts, output_states, pipeline_run_stage
      # The hash elements will be passed on to their respective factory as keyword arguments.
      taxon_counts_data { [] }
      contigs_data { [] }
      amr_counts_data { [] }
      output_states_data { [] }
      pipeline_run_stages_data { nil }
    end

    alignment_config { create(:alignment_config) }
    results_finalized { 0 }
    job_status { PipelineRun::STATUS_READY }

    pipeline_execution_strategy { PipelineRun.pipeline_execution_strategies[:step_function] }

    after :create do |pipeline_run, options|
      options.taxon_counts_data.each do |taxon_count_data|
        create(:taxon_count, pipeline_run: pipeline_run, **taxon_count_data)
      end
      options.contigs_data.each do |contig_data|
        create(:contig, pipeline_run: pipeline_run, **contig_data)
      end
      options.amr_counts_data.each do |amr_count_data|
        create(:amr_count, pipeline_run: pipeline_run, **amr_count_data)
      end
      options.output_states_data.each do |output_states_data|
        target_output = pipeline_run.output_states.find_by(output: output_states_data[:output])
        if target_output.present?
          target_output.update(state: output_states_data[:state])
        else
          create(:output_state, pipeline_run: pipeline_run, **output_states_data)
        end
      end
      unless options.pipeline_run_stages_data.nil?
        pipeline_run.pipeline_run_stages = options.pipeline_run_stages_data.map do |pipeline_run_stage_data|
          create(:pipeline_run_stage, pipeline_run: pipeline_run, **pipeline_run_stage_data)
        end
      end
    end
  end
end
