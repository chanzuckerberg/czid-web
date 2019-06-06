FactoryBot.define do
  factory :pipeline_run_stage, class: PipelineRunStage do
    name { nil }
    dag_json { nil }
  end
end
