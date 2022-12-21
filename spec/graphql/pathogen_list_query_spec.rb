require "rails_helper"

RSpec.describe GraphqlController, type: :request do
  describe "PathogenLists Graphql Query" do
    before do
      @global_list = create(:pathogen_list, creator_id: nil, is_global: true)
      @citation = create(:citation, key: "test_source", footnote: "test_footnote")
      @species_a = create(:taxon_lineage, tax_name: "species a", taxid: 1, species_taxid: 1, species_name: "species a", superkingdom_name: "superkingdom_a")
      @species_b = create(:taxon_lineage, tax_name: "species b", taxid: 2, species_taxid: 2, species_name: "species b", superkingdom_name: "superkingdom_b")
      @pathogen_a = create(:pathogen, citation_id: @citation.id, tax_id: @species_a.taxid)
      @pathogen_b = create(:pathogen, citation_id: @citation.id, tax_id: @species_b.taxid)
    end

    query = <<-GRAPHQL
      query GetPathogenList {
        pathogenList {
          version
          citations
          updatedAt
          pathogens {
            category
            name
            taxId
          }
        }
      }
    GRAPHQL

    context "full integration tests" do
      before do
        sign_in @admin
      end

      it "should return not found error if no list version exists" do
        post "/graphql", params: { query: query, context: { current_user: nil } }
        expect(response).to have_http_status 200

        result = JSON.parse(response.body)
        expect(result["errors"][0]["message"]).to eq("Pathogen list not found")
      end
    end

    it "should return the latest pathogen list version if version unspecified" do
      list_version = create(:pathogen_list_version, version: "0.1.0", pathogen_list_id: @global_list.id)
      list_version.pathogens << @pathogen_a
      list_version.pathogens << @pathogen_b

      pathogens_info = list_version.fetch_pathogens_info
      pathogens_info = pathogens_info.map { |pathogen| { category: pathogen[:category], name: pathogen[:name], taxId: pathogen[:tax_id] } }

      result = IdseqSchema.execute(query, context: { current_user: nil })

      expected = {
        version: list_version.version,
        updatedAt: list_version.updated_at.strftime("%Y-%m-%dT%H:%M:%S%:z"),
        pathogens: pathogens_info,
        citations: list_version.fetch_citation_footnotes,
      }

      # json_response = JSON.parse(result, { symbolize_names: true })
      expect(result["data"]["pathogenList"].deep_symbolize_keys).to eq(expected)
    end

    it "should return the correct pathogen list version if version specified" do
      query = <<-GRAPHQL
        query GetPathogenList {
          pathogenList(version: "0.1.0") {
            version
            citations
            updatedAt
            pathogens {
              category
              name
              taxId
            }
          }
        }
      GRAPHQL
      create(:pathogen_list_version, version: "0.1.1", pathogen_list_id: @global_list.id)
      old_list_version = create(:pathogen_list_version, version: "0.1.0", pathogen_list_id: @global_list.id)
      old_list_version.pathogens << @pathogen_a

      pathogens_info = old_list_version.fetch_pathogens_info
      pathogens_info = pathogens_info.map { |pathogen| { category: pathogen[:category], name: pathogen[:name], taxId: pathogen[:tax_id] } }

      expected = {
        version: old_list_version.version,
        updatedAt: old_list_version.updated_at.strftime("%Y-%m-%dT%H:%M:%S%:z"),
        pathogens: pathogens_info,
        citations: old_list_version.fetch_citation_footnotes,
      }

      result = IdseqSchema.execute(query, context: { current_user: nil }, variables: { version: "0.1.0" })

      expect(result["data"]["pathogenList"].deep_symbolize_keys).to eq(expected)
    end
  end
end
