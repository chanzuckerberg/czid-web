require "rails_helper"
require "webmock/rspec"

RSpec.describe ElasticsearchQueryHelper, type: :helper do
  describe "#query_es" do
    it "should return columns and rows" do
      req_body = "{\"query\":\"select * from scored_taxon_counts\", \"fetch_size\": #{ElasticsearchQueryHelper::DEFAULT_QUERY_FETCH_SIZE} }"
      req_resp = { "schema" => [{ "name" => "alignment_length", "type" => "float" }, { "name" => "superkingdom_taxid", "type" => "long" }, { "name" => "counts", "type" => "long" }, { "name" => "count_type", "type" => "text" }, { "name" => "e_value", "type" => "float" }, { "name" => "zscore", "type" => "long" }, { "name" => "background_id", "type" => "long" }, { "name" => "is_phage", "type" => "long" }, { "name" => "rpm", "type" => "float" }, { "name" => "tax_id", "type" => "long" }, { "name" => "tax_level", "type" => "long" }, { "name" => "family_taxid", "type" => "long" }, { "name" => "stdev_mass_normalized", "type" => "long" }, { "name" => "mean", "type" => "float" }, { "name" => "name", "type" => "text" }, { "name" => "percent_identity", "type" => "float" }, { "name" => "pipeline_run_id", "type" => "long" }, { "name" => "rank", "type" => "long" }, { "name" => "mean_mass_normalized", "type" => "long" }, { "name" => "genus_taxid", "type" => "long" }, { "name" => "stdev", "type" => "float" }], "datarows" => [[27_564.7, 2, 1_919_486, "NT", -291.3165, 99, 26, 0, 646_855.7, 561, 2, 543, nil, 7.01386, "Escherichia", 99.9543, 27_441, 1, nil, 561, 38.484]], "total" => 1, "size" => 1, "status" => 200 }
      resp = Elasticsearch::Transport::Transport::Response.new(@headers = { "content-type" => "application/json;" }, req_resp)
      expect(ElasticsearchQueryHelper).to receive(:es_sql_rest_call).with(req_body).and_return(resp)
      columns, es_records = ElasticsearchQueryHelper.query_es("select * from scored_taxon_counts")
      expect(columns.size).to eq 21
      expect(es_records.size).to eq 1
      expect(columns).to include("zscore", "pipeline_run_id", "rpm", "background_id", "rank")
      expect(es_records[0][5]).to eq 99 # zscore check
      expect(es_records[0][6]).to eq 26 # background_id check
    end
  end

  describe "#find_pipeline_runs_missing_from_es" do
    it "should find missing pipeline run ids" do
      req_body = "SELECT DISTINCT pipeline_run_id FROM scored_taxon_counts WHERE background_id=26 AND pipeline_run_id in (1,2)"
      cols = ["pipeline_run_id"]
      rows = [[1]]
      expect(ElasticsearchQueryHelper).to receive(:query_es).with(req_body).and_return([cols, rows])
      missing_ids = ElasticsearchQueryHelper.find_pipeline_runs_missing_from_es(26, [1, 2])
      expect(missing_ids.size).to eq 1
      expect(missing_ids[0]).to eq 2
    end
  end

  describe "#build_categories_filter_clause" do
    it "should return valid categories if phage is true and categories are blank " do
      categories_clause = ElasticsearchQueryHelper.build_categories_filter_clause([], true)
      expect(categories_clause[0].keys[0].to_s).to eq "term"
      expect(categories_clause[0][:term].keys[0].to_s).to eq "superkingdom_taxid"
      expect(categories_clause[0][:term][:superkingdom_taxid]).to eq "10239"
      expect(categories_clause[1][:term][:is_phage]).to eq 1
    end

    it "should return valid categories for Bacteria" do
      categories_clause = ElasticsearchQueryHelper.build_categories_filter_clause(["Bacteria"], false)
      expect(categories_clause[0].keys[0].to_s).to eq "terms"
      expect(categories_clause[0][:terms].keys[0].to_s).to eq "superkingdom_taxid"
      expect(categories_clause[0][:terms][:superkingdom_taxid].size).to eq 1
      expect(categories_clause[0][:terms][:superkingdom_taxid][0]).to eq 2
    end

    it "should return nil if categories is blank and phage is false" do
      categories_clause = ElasticsearchQueryHelper.build_categories_filter_clause([], false)
      expect(categories_clause).to be_empty
    end
  end

  describe "#build_read_specificity_filter_clause" do
    it "should return read specificity clause if read_specificity is 1" do
      read_specificity_clause = ElasticsearchQueryHelper.build_read_specificity_filter_clause(1)
      expect(read_specificity_clause[0]).to eq({ range: { tax_id: { gte: "0" } } })
    end
    it "should not return read specificity clause if read_specificity is not 1" do
      read_specificity_clause = ElasticsearchQueryHelper.build_read_specificity_filter_clause(0)
      expect(read_specificity_clause[0]).to eq nil
    end
  end

  describe "#parse_es_response" do
    let(:es_resp) { file_fixture("helpers/elasticsearch_query_helper/es_response.json").read }
    it "should return 2 taxons" do
      taxons = ElasticsearchQueryHelper.parse_es_response(JSON.parse(es_resp))
      expect(taxons.size).to eq 4
      expect(taxons[0].keys.size).to eq 20
      expect(taxons[0].key?("rpm")).to eq true
      expect(taxons[0]["rpm"]).to eq 3.7452
      expect(taxons[1].key?("zscore")).to eq true
      expect(taxons[1]["zscore"]).to eq 99.0
    end
  end
end
