require "rails_helper"
require "webmock/rspec"

RSpec.describe TopTaxonsElasticsearchService do
  describe "#build_filter_param_hash" do
    it "should return readSpecificity cast to an integer" do
      test_params = ActionController::Parameters.new(
        {
          readSpecificity: "1",
        }
      )
      service = TopTaxonsElasticsearchService.new(params: test_params, samples_for_heatmap: nil, background_for_heatmap: 26)

      filter_param_hash = service.send(:build_filter_param_hash)
      expect(filter_param_hash[:read_specificity]).to eq 1
    end
  end
end
