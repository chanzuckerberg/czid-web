FactoryBot.define do
  factory :job_stat, class: JobStat do
    association :pipeline_run
  end
end
