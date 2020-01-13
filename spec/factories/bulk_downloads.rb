FactoryBot.define do
  factory :bulk_download do
    download_type { "sample_overview" }
    status { "waiting" }

    before :create do |bulk_download, options|
      if options.params
        bulk_download.params_json = options.params.to_json
        # This ensures that during validation, the params have keys that are strings, not symbols.
        # We are inconsistent about whether we use symbols or strings in our Hashes.
        bulk_download.params = JSON.parse(bulk_download.params_json)
      end
    end
  end
end
