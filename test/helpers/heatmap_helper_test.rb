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
      minReads: 1,
    }

    @results_by_pr = HeatmapHelper.fetch_top_taxons(
      @samples,
      @background.id,
      @categories,
      @read_specificity,
      @include_phage,
      @num_results,
      @min_reads,
      @sort_by
    )
  end

  test "fetch_samples_taxons_counts" do
    taxon_counts = [taxon_counts(:one), taxon_counts(:two), taxon_counts(:six), taxon_counts(:seven)]
    results = HeatmapHelper.fetch_samples_taxons_counts(@samples, taxon_counts.pluck(:tax_id), taxon_counts.pluck(:genus_taxid), @background.id)
    assert_equal 2, results.length
  end

  test "sample_taxons_dict defaults" do
    dicts = HeatmapHelper.sample_taxons_dict(@params, @samples, @background.id)

    assert_equal @samples.length, dicts.length
    dict = dicts[0]
    assert dict.key?(:taxons)

    # TODO: (gdingle): why more?
    assert_equal 3, dict[:taxons].length

    taxon = dict[:taxons][0]
    assert_equal 9, taxon["NT"].length
    assert_equal 9, taxon["NR"].length
    assert_equal 100.0, taxon["NT"]["zscore"].abs
    assert_equal 100.0, taxon["NR"]["zscore"].abs
    assert_includes ["Streptococcus mitis", "Klebsiella pneumoniae"], taxon["name"]
    assert_equal "Bacteria", taxon["category_name"]
  end

  # If no taxons pass the threshold filter, the samples should still be returned in the response.
  test "sample_taxons_dict no filtered results" do
    params = {
      background: @background.id,
      sortBy: @sort_by,
      taxonsPerSample: @num_results,
      readSpecificity: 1,
      species: 1,
      subcategories: {},
      minReads: 1,
      thresholdFilters: [
        {
          metric: "NT_zscore",
          value: "1",
          operator: ">=",
        },
      ].to_json,
    }

    response = HeatmapHelper.sample_taxons_dict(params, @samples, @background.id)

    assert_equal @samples.length, response.length
    assert_equal "RR004_water_2_S23-20180208", response[0][:name]
    assert_equal "sample1", response[1][:name]
    assert_equal "sample2", response[2][:name]
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
    assert_equal "Klebsiella pneumoniae", taxon_count["name"]
    assert_equal 209, taxon_count["r"]

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
    assert_equal "Streptococcus", taxon_count["name"].split(' ')[0]
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
    assert_equal 1, top_taxons.length

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
    dicts = HeatmapHelper.samples_taxons_details(
      @results_by_pr,
      @samples,
      @species_selected,
      @threshold_filters
    )

    dict = dicts[0]
    assert_equal 3, dict[:taxons].length
    taxon = dict[:taxons][0]
    assert_equal 9, taxon["NT"].length
    assert_equal 9, taxon["NR"].length
    assert_equal 100.0, taxon["NT"]["zscore"].abs
    assert_equal 100.0, taxon["NR"]["zscore"].abs
  end

  test "samples_taxons_details species_selected false" do
    dicts = HeatmapHelper.samples_taxons_details(
      @results_by_pr,
      @samples,
      false,
      @threshold_filters
    )

    dict = dicts[0]
    assert_equal 3, dict[:taxons].length
  end

  test "threshold filters parsing" do
    assert_equal [
      { count_type: "NT", metric: "zscore", value: 2.0, operator: ">=" },
      { count_type: "NR", metric: "rpm", value: 1000.0, operator: "<=" },
    ], HeatmapHelper.parse_custom_filters([
                                            { "metric" => "NT_zscore", "value" => "2", "operator" => ">=" },
                                            { "metric" => "NR_rpm", "value" => "1000", "operator" => "<=" },
                                          ])
  end
end
