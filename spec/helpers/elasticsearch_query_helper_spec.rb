require "rails_helper"
require "webmock/rspec"

RSpec.describe ElasticsearchQueryHelper, type: :helper do
  describe "#query_es" do
    it "should return columns and rows" do
      req_body = "{\"query\":\"select * from scored_taxon_count\", \"fetch_size\": #{ElasticsearchQueryHelper::DEFAULT_QUERY_FETCH_SIZE} }"
      req_resp = { "schema" => [{ "name" => "alignment_length", "type" => "float" }, { "name" => "superkingdom_taxid", "type" => "long" }, { "name" => "counts", "type" => "long" }, { "name" => "count_type", "type" => "text" }, { "name" => "e_value", "type" => "float" }, { "name" => "zscore", "type" => "long" }, { "name" => "background_id", "type" => "long" }, { "name" => "is_phage", "type" => "long" }, { "name" => "rpm", "type" => "float" }, { "name" => "tax_id", "type" => "long" }, { "name" => "tax_level", "type" => "long" }, { "name" => "family_taxid", "type" => "long" }, { "name" => "stdev_mass_normalized", "type" => "long" }, { "name" => "mean", "type" => "float" }, { "name" => "name", "type" => "text" }, { "name" => "percent_identity", "type" => "float" }, { "name" => "pipeline_run_id", "type" => "long" }, { "name" => "rank", "type" => "long" }, { "name" => "mean_mass_normalized", "type" => "long" }, { "name" => "genus_taxid", "type" => "long" }, { "name" => "stdev", "type" => "float" }], "datarows" => [[27_564.7, 2, 1_919_486, "NT", -291.3165, 99, 26, 0, 646_855.7, 561, 2, 543, nil, 7.01386, "Escherichia", 99.9543, 27_441, 1, nil, 561, 38.484]], "total" => 1, "size" => 1, "status" => 200 }
      resp = Elasticsearch::Transport::Transport::Response.new(@headers = { "content-type" => "application/json;" }, req_resp)
      expect(ElasticsearchQueryHelper).to receive(:es_sql_rest_call).with(req_body).and_return(resp)
      columns, es_records = ElasticsearchQueryHelper.query_es("select * from scored_taxon_count")
      expect(columns.size).to eq 21
      expect(es_records.size).to eq 1
      expect(columns).to include("zscore", "pipeline_run_id", "rpm", "background_id", "rank")
      expect(es_records[0][5]).to eq 99 # zscore check
      expect(es_records[0][6]).to eq 26 # background_id check
    end
  end

  describe "#background_pipeline_present_in_es" do
    it "should find missing pipeline run ids" do
      req_body = "SELECT DISTINCT pipeline_run_id FROM scored_taxon_count WHERE background_id=26 AND pipeline_run_id in (1,2)"
      cols = ["pipeline_run_id"]
      rows = [[1]]
      expect(ElasticsearchQueryHelper).to receive(:query_es).with(req_body).and_return([cols, rows])
      missing_ids = ElasticsearchQueryHelper.background_pipeline_present_in_es(26, { 1 => [1], 2 => [2] })
      expect(missing_ids.size).to eq 1
      expect(missing_ids[0]).to eq 2
    end
  end

  describe "#build_sort_clause" do
    it "should build sort clause with metric and count_type" do
      sort_clauses = ElasticsearchQueryHelper.build_sort_clause("highest_nt_rpm")
      expect(sort_clauses.size).to eq 2
      expect(sort_clauses[0].keys[0].to_s).to eq "metric_list.count_type"
      expect(sort_clauses[1].keys[0].to_s).to eq "metric_list.rpm"
      expect(sort_clauses[0][:"metric_list.count_type"][:order]).to eq "desc"
      expect(sort_clauses[1][:"metric_list.rpm"][:order]).to eq "desc"
    end
  end

  describe "#add_categories_filter" do
    it "should return valid categories if phage is true and categories are black " do
      categories_clause = ElasticsearchQueryHelper.get_categories_filter([], true)
      expect(categories_clause.keys[0].to_s).to eq "term"
      expect(categories_clause[:term].keys[0].to_s).to eq "superkingdom_taxid"
      expect(categories_clause[:term][:superkingdom_taxid]).to eq "10239"
    end

    it "should return valid categories for Bacteria" do
      categories_clause = ElasticsearchQueryHelper.get_categories_filter(["Bacteria"], false)
      expect(categories_clause.keys[0].to_s).to eq "terms"
      expect(categories_clause[:terms].keys[0].to_s).to eq "superkingdom_taxid"
      expect(categories_clause[:terms][:superkingdom_taxid].size).to eq 1
      expect(categories_clause[:terms][:superkingdom_taxid][0]).to eq 2
    end

    it "should return nil if categories is blank and phage is false" do
      categories_clause = ElasticsearchQueryHelper.get_categories_filter([], false)
      expect(categories_clause).to eq nil
    end
  end

  describe "#get_phage_filter" do
    it "should return first value of the array as phage clause if include phage is false and categories present" do
      phage_clauses = ElasticsearchQueryHelper.get_phage_filter(["Bacteria"], false)
      expect(phage_clauses[0].present?).to eq true
      expect(phage_clauses[0]).to eq({ term: { is_phage: 1 } })
      expect(phage_clauses[1]).to eq nil
    end
    it "should return second value of the array as phage clause if include phage is true and categories blank" do
      phage_clauses = ElasticsearchQueryHelper.get_phage_filter([], true)
      expect(phage_clauses[1].present?).to eq true
      expect(phage_clauses[1]).to eq({ term: { is_phage: 1 } })
      expect(phage_clauses[0]).to eq nil
    end
  end

  describe "#get_read_specificity_filter" do
    it "should return read specificity clause if read_specificity is 1" do
      read_specificity_clause = ElasticsearchQueryHelper.get_read_specificity_filter(1)
      expect(read_specificity_clause).to eq({ range: { tax_id: { gte: "0" } } })
    end
    it "should not return read specificity clause if read_specificity is not 1" do
      read_specificity_clause = ElasticsearchQueryHelper.get_read_specificity_filter(0)
      expect(read_specificity_clause).to eq nil
    end
  end

  describe "#build_query_must_clause" do
    it "should return TH, county_type and counts filter" do
      query_must_clause = ElasticsearchQueryHelper.build_query_must_clause(5,
                                                                           [{ "metricDisplay" => "NT Z Score", "metric" => "NT_zscore", "value" => "1", "operator" => ">=" }])
      expect(query_must_clause.size).to eq 2
      expect(query_must_clause[0][:nested][:query][:bool][:must].size).to eq 3
      th_filter = query_must_clause[0][:nested][:query][:bool][:must][0]
      expect(th_filter[:range].keys[0].to_s).to eq "metric_list.zscore"
      expect(th_filter[:range][:"metric_list.zscore"].keys[0].to_s).to eq "gte"
      expect(th_filter[:range][:"metric_list.zscore"][:gte]).to eq "1.0"
      count_type_filter = query_must_clause[0][:nested][:query][:bool][:must][1]
      expect(count_type_filter[:match].keys[0].to_s).to eq "metric_list.count_type"
      expect(count_type_filter[:match][:"metric_list.count_type"]).to eq "NT"
      counts_filter = query_must_clause[0][:nested][:query][:bool][:must][2]
      expect(counts_filter[:range].keys[0].to_s).to eq "metric_list.counts"
      expect(counts_filter[:range][:"metric_list.counts"].keys[0].to_s).to eq "gte"
      expect(counts_filter[:range][:"metric_list.counts"][:gte]).to eq 5
    end
    it "should return county_type and counts filter if no TH filter" do
      query_must_clause = ElasticsearchQueryHelper.build_query_must_clause(5, [])
      expect(query_must_clause.size).to eq 2
      expect(query_must_clause[0][:nested][:query][:bool][:must].size).to eq 2
      count_type_filter = query_must_clause[0][:nested][:query][:bool][:must][0]
      expect(count_type_filter[:match].keys[0].to_s).to eq "metric_list.count_type"
      expect(count_type_filter[:match][:"metric_list.count_type"]).to eq "NT"
      counts_filter = query_must_clause[0][:nested][:query][:bool][:must][1]
      expect(counts_filter[:range].keys[0].to_s).to eq "metric_list.counts"
      expect(counts_filter[:range][:"metric_list.counts"].keys[0].to_s).to eq "gte"
      expect(counts_filter[:range][:"metric_list.counts"][:gte]).to eq 5
    end
  end

  describe "#parse_es_response" do
    let(:es_resp) { file_fixture("helpers/elasticsearch_query_helper/es_response.json").read }
    it "should return 2 taxons" do
      taxons = ElasticsearchQueryHelper.parse_es_response(JSON.parse(es_resp))
      expect(taxons.size).to eq 2
      expect(taxons[0].keys.size).to eq 18
      expect(taxons[0].key?("rpm")).to eq true
      expect(taxons[0]["rpm"]).to eq 640_414.7051
      expect(taxons[1].key?("zscore")).to eq true
      expect(taxons[1]["zscore"]).to eq 99.0
    end
  end

  describe "#build_query_filter_clause" do
    it "should return filter for background, pipeline runs, taxon level" do
      filter_param = { background_id: 1, taxon_level: 1, taxon_ids: [1, 2] }
      filter_clause = ElasticsearchQueryHelper.build_query_filter_clause({ 1 => [], 2 => [] }, filter_param)
      expect(filter_clause.size).to eq 4
      expect(filter_clause[0]).to eq({ terms: { pipeline_run_id: [1, 2] } })
      expect(filter_clause[1]).to eq({ term: { background_id: "1" } })
      expect(filter_clause[2]).to eq({ term: { tax_level: "1" } })
    end
  end

  describe "#build_query_must_not_clause" do
    it "should return genus tax id and phage filter" do
      must_not_clause = ElasticsearchQueryHelper.build_query_must_not_clause([1], false)
      expect(must_not_clause.size).to eq 2
      expect(must_not_clause[0]).to eq({ term: { genus_taxid: "-201" } })
      expect(must_not_clause[1]).to eq({ term: { is_phage: 1 } })
    end
  end

  describe "#build_query_clause" do
    it "should have must, filter and must_not query clauses" do
      filter_param = { background_id: 1, taxon_level: 1, taxon_ids: [1, 2] }
      query_clause = ElasticsearchQueryHelper.build_query_clause({ 1 => [], 2 => [] }, filter_param)
      expect(query_clause.present?).to eq true
      expect(query_clause.key?(:bool)).to eq true
      expect(query_clause[:bool].keys.size).to eq 3
      expect(query_clause[:bool].key?(:must)).to eq true
      expect(query_clause[:bool].key?(:filter)).to eq true
      expect(query_clause[:bool].key?(:must_not)).to eq true
    end
  end
end
