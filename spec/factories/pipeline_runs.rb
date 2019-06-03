FactoryBot.define do
  factory :pipeline_run, class: PipelineRun do
    transient do
      taxon_counts_data { [] }
    end

    alignment_config { create(:alignment_config) }

    after :create do |pipeline_run, options|
      options.taxon_counts_data.each do |taxon_count_data|
        create(:taxon_count, pipeline_run: pipeline_run, **taxon_count_data)
      end
    end
  end
end
