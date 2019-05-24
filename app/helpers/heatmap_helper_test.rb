require 'test_helper'

# TODO: (gdingle): store inputs and outputs from for known good values
class HeatmapHelperTest < ActiveSupport::TestCase
  setup do
    @samples = [samples(:one), samples(:two)]
    @background = backgrounds(:real_background)
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

    # TODO: (gdingle): avoid warning "warning: previous definition"
    # Temp change for allowing less test data
    @_min_read = HeatmapHelper::MINIMUM_READ_THRESHOLD
    HeatmapHelper::MINIMUM_READ_THRESHOLD = 1
  end

  teardown do
    HeatmapHelper::MINIMUM_READ_THRESHOLD = @_min_read
  end

  test "sample_taxons_dict works" do
    dicts = HeatmapHelper.sample_taxons_dict(@params, @samples)
    assert_equal @samples.length, dicts.length
    dict = dicts[0]
    assert_equal 1, dict[:taxons].length
    taxon = dict[:taxons][0]
    assert_equal 10, taxon["NT"].length
    assert_equal 10, taxon["NR"].length
    assert_equal 100, taxon["NT"]["zscore"]
    assert_equal 100 * -1, taxon["NR"]["zscore"]
  end

  # TODO: (gdingle): need fetch_top_taxons first
  test "top_taxons_details works" do
    details = HeatmapHelper.top_taxons_details(
      @samples,
      @background_id,
      @num_results,
      @sort_by,
      @species_selected,
      @categories,
      @threshold_filters = {},
      @read_specificity = false,
      @include_phage = false
    )
    assert_equal [{ 'tax_id' => 1,
                    'samples' => { @samples[0].id => [1, 1, 100, -100], @samples[1].id => [1, 1, 100, -100] },
                    'max_aggregate_score' => 100 }],
                 details
  end

  test "fetch_top_taxons works" do
    # TODO: (gdingle): num_results, sort
    top_taxons = HeatmapHelper.fetch_top_taxons(
      @samples,
      @background.id,
      @categories,
      @read_specificity,
      @include_phage,
      @num_results
    )
    assert_equal 2, top_taxons.length
    top_taxon = top_taxons[@samples[0].pipeline_runs[0].id]
    taxon_counts = top_taxon["taxon_counts"]
    assert_equal 1, taxon_counts.length
    taxon_count = taxon_counts[0]
    assert_equal "some species", taxon_count["name"]
    assert_equal 100, taxon_count["zscore"]
    assert_equal 1_000_000, taxon_count["rpm"]
  end

  # test "samples_taxons_details works" do
  #   # TODO: (gdingle): num_results, sort
  #   HeatmapHelper.samples_taxons_details(
  #     @samples,
  #     taxon_ids,
  #     @background.id,
  #     @species_selected,
  #     @threshold_filters
  #   )
  # end
end
