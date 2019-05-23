# TODO: (gdingle): store inputs and outputs from for known good values
class HeatmapHelper < ActiveSupport::TestCase
  setup do
    @samples = "TODO"
    @background_id = "TODO"
    @num_results = "TODO"
    @categories = "TODO"
    @threshold_filters = "TODO"
    @read_specificity = "TODO"
    @include_phage = "TODO"
    @species_selected = "TODO"

    @sort_by_key = "TODO"
  end

  test "sample_taxons_dict works" do
    HeatmapHelper.sample_taxons_dict(params,
                                     @samples)
  end

  test "top_taxons_details works" do
    HeatmapHelper.top_taxons_details(
      @samples,
      @background_id,
      @num_results,
      @sort_by_key,
      @species_selected,
      @categories,
      @threshold_filters = {},
      @read_specificity = false,
      @include_phage = false
    )
  end

  test "fetch_top_taxons works" do
    # TODO: (gdingle): num_results, sort
    HeatmapHelper.fetch_top_taxons(
      @samples,
      @background_id,
      @categories,
      @read_specificity = false,
      @include_phage = false,
      @num_results = 1_000_000
    )
  end

  test "samples_taxons_details works" do
    # TODO: (gdingle): num_results, sort
    HeatmapHelper.samples_taxons_details(
      @samples,
      taxon_ids,
      @background_id,
      @species_selected,
      @threshold_filters
    )
  end
end
