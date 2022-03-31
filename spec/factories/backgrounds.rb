FactoryBot.define do
  factory :background do
    sequence(:name) { |n| "Background #{n}" }
    transient do
      taxon_summaries_data { [] }
      pipeline_runs_count { 2 }
    end

    pipeline_runs do
      Array.new(pipeline_runs_count) do
        association :pipeline_run
      end
    end

    before :create do |background, options|
      options.taxon_summaries_data.each do |taxon_summary_data|
        create(:taxon_summary, background: background, **taxon_summary_data)
      end
    end
  end
end
