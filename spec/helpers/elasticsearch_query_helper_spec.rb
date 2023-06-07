require "rails_helper"
require "webmock/rspec"

RSpec.describe ElasticsearchQueryHelper, type: :helper do
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
