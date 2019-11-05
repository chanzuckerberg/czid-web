FactoryBot.define do
  factory :bulk_download do
    download_type { "sample_overview" }
    status { "waiting" }

    before :create do |bulk_download, options|
      if options.params
        bulk_download.params_json = options.params.to_json
      end
    end
  end
end
