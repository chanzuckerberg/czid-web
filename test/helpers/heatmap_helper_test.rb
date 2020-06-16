require 'test_helper'

class HeatmapHelperTest < ActiveSupport::TestCase
  setup do
    @samples = [samples(:one), samples(:two), samples(:six)]
    @background = backgrounds(:real_background)
    @min_reads = 1 # different from default to allow fewer fixtures

    @num_results = HeatmapHelper::DEFAULT_MAX_NUM_TAXONS
    @sort_by = HeatmapHelper::DEFAULT_TAXON_SORT_PARAM

    @categories = nil
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
      read_specificity: @read_specificity,
      include_phage: @include_phage,
      num_results: @num_results,
      min_reads: @min_reads,
      sort_by: @sort_by,
      client_filtering_enabled: true
    )
    @top_taxons_details = [{ "tax_id" => 1, "samples" => { 980_190_962 => [1, 1, 100.0, -100] }, "genus_taxid" => -200, "max_aggregate_score" => 1_000_000.0 }, { "tax_id" => 28_037, "samples" => { 51_848_956 => [1, 1, 100.0, -100] } }, { "tax_id" => 573, "samples" => { 51_848_956 => [2, 1, 100.0, 100.0] } }, { "tax_id" => 1313, "samples" => { 51_848_956 => [3, 1, -100, 7.7560896] }, "genus_taxid" => 1301 }].sort_by! { |d| d["tax_id"] }
  end

  test "sample_taxons_dict defaults" do
    dicts = HeatmapHelper.sample_taxons_dict(@params, @samples, @background.id)

    assert_equal @samples.length, dicts.length
    dict = dicts.find { |d| d[:sample_id] == 51_848_956 }
    assert dict.key?(:taxons)
    assert_equal 2, dict[:taxons].length
    taxon = dict[:taxons].find { |t| t["tax_id"] == 573 }
    assert_equal 9, taxon["NT"].length
    assert_equal 9, taxon["NR"].length
    assert_equal 99, taxon["NT"]["zscore"]
    assert_equal 99, taxon["NR"]["zscore"]
    assert_equal "Klebsiella pneumoniae", taxon["name"]
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
          value: "10000",
          operator: ">=",
        },
      ].to_json,
    }

    response = HeatmapHelper.sample_taxons_dict(params, @samples, @background.id)

    assert_equal @samples.length, response.length
    assert_equal "sample1", response[0][:name]
    assert_equal "sample2", response[1][:name]
    assert_equal "RR004_water_2_S23-20180208", response[2][:name]
    assert !response[0].key?(:taxons)
    assert !response[1].key?(:taxons)
    assert !response[2].key?(:taxons)
  end

  test "top_taxons_details defaults" do
    details = HeatmapHelper.top_taxons_details(
      @results_by_pr,
      @num_results,
      @sort_by,
      @species_selected,
      @threshold_filters
    )
    details.sort_by! { |d| d["tax_id"] }
    assert_equal 4, details.length
    assert_equal 1_000_000.0, details[0]["max_aggregate_score"]
    assert_equal @top_taxons_details[0], details[0]
    assert_equal @top_taxons_details[2], details[2]
  end

  test "top_taxons_details num_results" do
    details = HeatmapHelper.top_taxons_details(
      @results_by_pr,
      1,
      @sort_by,
      @species_selected,
      @threshold_filters
    )
    assert_equal 2, details.length
  end

  test "top_taxons_details sort_by" do
    details = HeatmapHelper.top_taxons_details(
      @results_by_pr,
      @num_results,
      "highest_nt_rpm",
      @species_selected,
      @threshold_filters
    )
    assert_equal 1_000_000.0, details[0]["max_aggregate_score"]
  end

  test "top_taxons_details species_selected false" do
    details = HeatmapHelper.top_taxons_details(
      @results_by_pr,
      @num_results,
      @sort_by,
      false,
      @threshold_filters
    )
    assert_equal 570, details[0]["tax_id"]
  end

  test "fetch_top_taxons defaults" do
    top_taxons = HeatmapHelper.fetch_top_taxons(
      @samples,
      @background.id,
      @categories,
      read_specificity: @read_specificity,
      include_phage: @include_phage,
      num_results: @num_results,
      min_reads: @min_reads,
      sort_by: @sort_by
    )
    assert_equal 2, top_taxons.length
    top_taxon = top_taxons[@samples[0].id]
    taxon_counts = top_taxon["taxon_counts"]
    assert_equal 1, taxon_counts.length
    taxon_count = taxon_counts[0]
    assert_equal 100, taxon_count["zscore"]
    assert_equal 1_000_000, taxon_count["rpm"]
  end

  test "fetch_top_taxons mass_normalized" do
    top_taxons = HeatmapHelper.fetch_top_taxons(
      @samples,
      backgrounds(:real_background_mass_normalized).id,
      @categories,
      read_specificity: @read_specificity,
      include_phage: @include_phage,
      num_results: @num_results,
      min_reads: @min_reads,
      sort_by: @sort_by
    )
    assert_equal 2, top_taxons.length
    top_taxon = top_taxons[pipeline_runs(:six).id]
    taxon_counts = top_taxon["taxon_counts"]
    assert_equal 4, taxon_counts.length
    taxon_count = taxon_counts[0]
    assert_equal 0.361884514757802 * -1, taxon_count["zscore"]
    assert_equal 336_012.8617363344, taxon_count["rpm"]
  end

  test "fetch_top_taxons num_results" do
    top_taxons = HeatmapHelper.fetch_top_taxons(
      @samples,
      @background.id,
      @categories,
      read_specificity: @read_specificity,
      include_phage: @include_phage,
      num_results: 0,
      min_reads: @min_reads,
      sort_by: @sort_by
    )
    assert_equal 0, top_taxons.length
  end

  test "fetch_top_taxons sort_by" do
    top_taxons = HeatmapHelper.fetch_top_taxons(
      @samples,
      @background.id,
      @categories,
      read_specificity: @read_specificity,
      include_phage: @include_phage,
      num_results: @num_results,
      min_reads: @min_reads,
      sort_by: "highest_nt_r"
    )
    top_taxon = top_taxons.first[1]
    taxon_count = top_taxon["taxon_counts"][0]
    assert_equal "Klebsiella pneumoniae", taxon_count["name"]
    assert_equal 209, taxon_count["r"]

    top_taxons = HeatmapHelper.fetch_top_taxons(
      @samples,
      @background.id,
      @categories,
      read_specificity: @read_specificity,
      include_phage: @include_phage,
      num_results: @num_results,
      min_reads: @min_reads,
      sort_by: "lowest_nt_r"
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
      read_specificity: @read_specificity,
      include_phage: true,
      num_results: @num_results,
      min_reads: @min_reads,
      sort_by: @sort_by
    )
    assert_equal 0, top_taxons.length
  end

  test "fetch_top_taxons categories" do
    top_taxons = HeatmapHelper.fetch_top_taxons(
      @samples,
      @background.id,
      ["Uncategorized"],
      read_specificity: @read_specificity,
      include_phage: @include_phage,
      num_results: @num_results,
      min_reads: @min_reads,
      sort_by: @sort_by
    )
    assert_equal 1, top_taxons.length

    top_taxons = HeatmapHelper.fetch_top_taxons(
      @samples,
      @background.id,
      ["Bacteria"],
      read_specificity: @read_specificity,
      include_phage: @include_phage,
      num_results: @num_results,
      min_reads: @min_reads,
      sort_by: @sort_by
    )
    assert_equal 1, top_taxons.length
  end

  test "samples_taxons_details defaults" do
    dicts = HeatmapHelper.samples_taxons_details(
      @results_by_pr,
      @samples,
      @top_taxons_details.pluck('tax_id'),
      @species_selected,
      @threshold_filters
    )

    dict = dicts[0]
    assert_equal 3, dict[:taxons].length
    taxon = dict[:taxons][0]
    assert_equal 9, taxon["NT"].length
    assert_equal 9, taxon["NR"].length
    assert_equal 99.0, taxon["NT"]["zscore"]
    assert_equal 99.0, taxon["NR"]["zscore"]
  end

  test "samples_taxons_details species_selected false" do
    dicts = HeatmapHelper.samples_taxons_details(
      @results_by_pr,
      @samples,
      @top_taxons_details.pluck('tax_id'),
      false,
      @threshold_filters
    )

    dict = dicts[0]
    assert_equal 0, dict[:taxons].length
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
