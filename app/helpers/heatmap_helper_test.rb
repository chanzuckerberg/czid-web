require 'test_helper'

class HeatmapHelperTest < ActiveSupport::TestCase
  setup do
    @samples = [samples(:one), samples(:two), samples(:six)]
    @background = backgrounds(:real_background)
    @min_reads = 1 # different from default to allow fewer fixtures

    @num_results = HeatmapHelper::DEFAULT_MAX_NUM_TAXONS
    @sort_by = HeatmapHelper::DEFAULT_TAXON_SORT_PARAM

    @categories = []
    @threshold_filters = []
    @read_specificity = true
    @include_phage = false
    @species_selected = true

    @params = {
      background: @background.id,
      sortBy: @sort_by,
      taxonsPerSample: @num_results,
      readSpecificity: 1,
      species: 1,
      subcategories: {},
      minReads: 1
    }

    @top_taxons_details = [{ "tax_id" => 573, "samples" => { 51_848_956 => [1, 1, 100.0, 100.0] }, "max_aggregate_score" => 100.0 }, { "tax_id" => 28_037, "samples" => { 51_848_956 => [2, 1, 100.0, -100] }, "max_aggregate_score" => 100.0 }, { "tax_id" => 1, "samples" => { 980_190_962 => [1, 1, 100.0, -100], 298_486_374 => [1, 1, 100.0, -100] }, "max_aggregate_score" => 100.0 }, { "tax_id" => 1313, "samples" => { 51_848_956 => [3, 1, -100, 100.0] } }]
  end

  test "sample_taxons_dict defaults" do
    dicts = HeatmapHelper.sample_taxons_dict(@params, @samples)

    assert_equal @samples.length, dicts.length
    dict = dicts[0]
    assert_equal 3, dict[:taxons].length
    taxon = dict[:taxons][0]
    assert_equal 10, taxon["NT"].length
    assert_equal 10, taxon["NR"].length
    assert_equal 99, taxon["NT"]["zscore"]
    assert_equal 99, taxon["NR"]["zscore"]
    assert_equal "Klebsiella pneumoniae", taxon["name"]
    assert_equal "Bacteria", taxon["category_name"]
  end

  test "top_taxons_details defaults" do
    details = HeatmapHelper.top_taxons_details(
      @samples,
      @background_id,
      @num_results,
      @sort_by,
      @species_selected,
      @categories,
      @threshold_filters = {},
      @read_specificity,
      @include_phage,
      @min_reads
    )
    assert_equal 4, details.length
    assert_equal 100, details[0]["max_aggregate_score"]
    assert_equal @top_taxons_details, details
  end

  test "top_taxons_details num_results" do
    details = HeatmapHelper.top_taxons_details(
      @samples,
      @background_id,
      0,
      @sort_by,
      @species_selected,
      @categories,
      @threshold_filters = {},
      @read_specificity,
      @include_phage,
      @min_reads
    )
    assert_equal 0, details.length
  end

  test "top_taxons_details sort_by" do
    details = HeatmapHelper.top_taxons_details(
      @samples,
      @background_id,
      @num_results,
      "highest_nt_rpm",
      @species_selected,
      @categories,
      @threshold_filters = {},
      @read_specificity,
      @include_phage,
      @min_reads
    )
    assert_equal 2_000_000.0, details[0]["max_aggregate_score"]
  end

  test "top_taxons_details species_selected false" do
    details = HeatmapHelper.top_taxons_details(
      @samples,
      @background_id,
      @num_results,
      @sort_by,
      false,
      @categories,
      @threshold_filters = {},
      @read_specificity,
      @include_phage,
      @min_reads
    )
    assert_equal 570, details[0]["tax_id"]
  end

  test "fetch_top_taxons defaults" do
    top_taxons = HeatmapHelper.fetch_top_taxons(
      @samples,
      @background.id,
      @categories,
      @read_specificity,
      @include_phage,
      @num_results,
      @min_reads,
      @sort_by
    )
    assert_equal 3, top_taxons.length
    top_taxon = top_taxons[@samples[0].pipeline_runs[0].id]
    taxon_counts = top_taxon["taxon_counts"]
    assert_equal 1, taxon_counts.length
    taxon_count = taxon_counts[0]
    assert_equal "some species", taxon_count["name"]
    assert_equal 100, taxon_count["zscore"]
    assert_equal 1_000_000, taxon_count["rpm"]
  end

  test "fetch_top_taxons num_results" do
    top_taxons = HeatmapHelper.fetch_top_taxons(
      @samples,
      @background.id,
      @categories,
      @read_specificity,
      @include_phage,
      0,
      @min_reads,
      @sort_by
    )
    assert_equal 0, top_taxons.length
  end

  test "fetch_top_taxons sort_by" do
    top_taxons = HeatmapHelper.fetch_top_taxons(
      @samples,
      @background.id,
      @categories,
      @read_specificity,
      @include_phage,
      @num_results,
      @min_reads,
      "highest_nt_r"
    )
    top_taxon = top_taxons.first[1]
    taxon_count = top_taxon["taxon_counts"][0]
    assert_equal "Klebsiella", taxon_count["name"]
    assert_equal 217, taxon_count["r"]

    top_taxons = HeatmapHelper.fetch_top_taxons(
      @samples,
      @background.id,
      @categories,
      @read_specificity,
      @include_phage,
      @num_results,
      @min_reads,
      "lowest_nt_r"
    )
    top_taxon = top_taxons.first[1]
    taxon_count = top_taxon["taxon_counts"][0]
    assert_equal "Streptococcus", taxon_count["name"]
    assert_equal 4, taxon_count["r"]
  end

  test "fetch_top_taxons include_phage" do
    top_taxons = HeatmapHelper.fetch_top_taxons(
      @samples,
      @background.id,
      @categories,
      @read_specificity,
      true,
      @num_results,
      @min_reads,
      @sort_by
    )
    assert_equal 0, top_taxons.length
  end

  test "fetch_top_taxons categories" do
    top_taxons = HeatmapHelper.fetch_top_taxons(
      @samples,
      @background.id,
      ["Uncategorized"],
      @read_specificity,
      @include_phage,
      @num_results,
      @min_reads,
      @sort_by
    )
    assert_equal 2, top_taxons.length

    top_taxons = HeatmapHelper.fetch_top_taxons(
      @samples,
      @background.id,
      ["Bacteria"],
      @read_specificity,
      @include_phage,
      @num_results,
      @min_reads,
      @sort_by
    )
    assert_equal 1, top_taxons.length
  end

  test "samples_taxons_details defaults" do
    # TODO: (gdingle): num_results, sort
    dicts = HeatmapHelper.samples_taxons_details(
      @samples,
      @top_taxons_details.pluck('tax_id'),
      @background.id,
      @species_selected,
      @threshold_filters
    )

    dict = dicts[0]
    assert_equal 3, dict[:taxons].length
    taxon = dict[:taxons][0]
    assert_equal 10, taxon["NT"].length
    assert_equal 10, taxon["NR"].length
    assert_equal 99, taxon["NT"]["zscore"]
    assert_equal 99, taxon["NR"]["zscore"]
  end

  test "samples_taxons_details species_selected false" do
    dicts = HeatmapHelper.samples_taxons_details(
      @samples,
      @top_taxons_details.pluck('tax_id'),
      @background.id,
      false,
      @threshold_filters
    )

    dict = dicts[0]
    assert_equal 0, dict[:taxons].length
  end
end
