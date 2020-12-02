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
      min_reads: @min_reads
    )
    @top_taxons_details = [
      { "tax_id" => 1, "samples" => { 980_190_962 => [1, 1, 100.0, -100] }, "genus_taxid" => -200, "max_aggregate_score" => 1_000_000.0 },
      { "tax_id" => 570, "samples" => { 51_848_956 => [1, 2, 99.0, 99.0] }, "genus_taxid" => 570, "max_aggregate_score" => 348_874.5980707 },
      { "tax_id" => 573, "samples" => { 51_848_956 => [2, 1, 99.0, 99.0] }, "genus_taxid" => 570, "max_aggregate_score" => 336_012.8617363 },
      { "tax_id" => 1301, "samples" => { 51_848_956 => [4, 2, 4.1406012, 3.1963903] }, "genus_taxid" => 1301, "max_aggregate_score" => 6430.8681672 },
      { "tax_id" => 1313, "samples" => { 51_848_956 => [5, 1, -100, 7.7560896] }, "genus_taxid" => 1301 },
      { "tax_id" => 28_037, "samples" => { 51_848_956 => [3, 1, 17.0075651, -100] }, "genus_taxid" => 1301, "max_aggregate_score" => 6430.8681672 },
    ].sort_by! { |d| d["tax_id"] }
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

  # If no taxons pass the filters, the samples should still be returned in the response.
  test "sample_taxons_dict no filtered results" do
    params = {
      background: @background.id,
      sortBy: @sort_by,
      taxonsPerSample: @num_results,
      readSpecificity: 1,
      species: 1,
      subcategories: {},
      minReads: 1000,
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
    assert_not response[0].key?(:taxons)
    assert_not response[1].key?(:taxons)
    assert_not response[2].key?(:taxons)
  end

  test "top_taxons_details defaults" do
    details = HeatmapHelper.top_taxons_details(
      @results_by_pr,
      @sort_by
    )
    details.sort_by! { |d| d["tax_id"] }
    assert_equal 6, details.length
    assert_equal 1_000_000.0, details[0]["max_aggregate_score"]
    assert_equal @top_taxons_details[0], details[0]
    assert_equal @top_taxons_details[2], details[2]
  end

  test "top_taxons_details sort_by" do
    details = HeatmapHelper.top_taxons_details(
      @results_by_pr,
      "highest_nt_rpm"
    )
    assert_equal 1_000_000.0, details[0]["max_aggregate_score"]
  end

  test "fetch_top_taxons defaults" do
    top_taxons = HeatmapHelper.fetch_top_taxons(
      @samples,
      @background.id,
      min_reads: @min_reads
    )
    assert_equal 2, top_taxons.length
    top_taxon = top_taxons[@samples[0].id]
    taxon_counts = top_taxon["taxon_counts"]
    assert_equal 1, taxon_counts.length
    taxon_count = taxon_counts[0]
    assert_equal 100, taxon_count["zscore"]
    assert_equal 1_000_000, taxon_count["rpm"]
  end

  test "samples_taxons_details defaults" do
    dicts = HeatmapHelper.samples_taxons_details(
      @results_by_pr,
      @samples,
      @top_taxons_details.pluck('tax_id'),
      @threshold_filters
    )

    dict = dicts[0]
    assert_equal 5, dict[:taxons].length
    taxon = dict[:taxons][0]
    assert_equal 9, taxon["NT"].length
    assert_equal 9, taxon["NR"].length
    assert_equal 99.0, taxon["NT"]["zscore"]
    assert_equal 99.0, taxon["NR"]["zscore"]
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
