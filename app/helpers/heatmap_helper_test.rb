require 'test_helper'

# TODO: (gdingle): store inputs and outputs from for known good values
class HeatmapHelperTest < ActiveSupport::TestCase
  setup do
    @samples = [samples(:one), samples(:two)]
    @background = backgrounds(:one)
    @num_results = 30 # default in UI
    @sort_by = "highest_nt_zscore"

    # @categories = ReportHelper::ALL_CATEGORIES.map { |category| category['name'] }
    # TODO: (gdingle): vary these
    @categories = []
    @threshold_filters = []
    @read_specificity = false
    @include_phage = false
    @species_selected = true

    @params = {
      background: @background.id,
      sortBy: @sort_by,
      taxonsPerSample: @num_results,
      readSpecificity: 1,
      species: 1,
      subcategories: {}
    }
  end

  test "sample_taxons_dict works" do
    dict = HeatmapHelper.sample_taxons_dict(@params, @samples)
    assert_equal [
      { sample_id: 980_190_962, name: "sample1", metadata: [], host_genome_name: nil },
      { sample_id: 298_486_374, name: "sample2", metadata: [], host_genome_name: nil }
    ], dict
  end

  # test "top_taxons_details works" do
  #   HeatmapHelper.top_taxons_details(
  #     @samples,
  #     @background_id,
  #     @num_results,
  #     @sort_by,
  #     @species_selected,
  #     @categories,
  #     @threshold_filters = {},
  #     @read_specificity = false,
  #     @include_phage = false
  #   )
  # end

  # test "fetch_top_taxons works" do
  #   # TODO: (gdingle): num_results, sort
  #   HeatmapHelper.fetch_top_taxons(
  #     @samples,
  #     @background_id,
  #     @categories,
  #     @read_specificity = false,
  #     @include_phage = false,
  #     @num_results = 1_000_000
  #   )
  # end

  # test "samples_taxons_details works" do
  #   # TODO: (gdingle): num_results, sort
  #   HeatmapHelper.samples_taxons_details(
  #     @samples,
  #     taxon_ids,
  #     @background_id,
  #     @species_selected,
  #     @threshold_filters
  #   )
  # end
end
