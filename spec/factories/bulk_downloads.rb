FactoryBot.define do
  factory :bulk_download do
    download_type { "sample_overview" }
    status { "waiting" }
  end
end
