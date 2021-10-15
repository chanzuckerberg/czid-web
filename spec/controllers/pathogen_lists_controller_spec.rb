require "rails_helper"

RSpec.describe PathogenListsController, type: :controller do
  before do
    @global_list = create(:pathogen_list, creator_id: nil, is_global: true)
    @citation = create(:citation, key: "test_source", footnote: "test_footnote")
    @species_a = create(:taxon_lineage, tax_name: "species a", taxid: 1, species_taxid: 1, species_name: "species a", superkingdom_name: "superkingdom_a")
    @species_b = create(:taxon_lineage, tax_name: "species b", taxid: 2, species_taxid: 2, species_name: "species b", superkingdom_name: "superkingdom_b")
    @pathogen_a = create(:pathogen, citation_id: @citation.id, tax_id: @species_a.taxid)
    @pathogen_b = create(:pathogen, citation_id: @citation.id, tax_id: @species_b.taxid)
  end

  context "when the feature is launched" do
    before do
      expect(AppConfigHelper).to receive(:get_json_app_config).and_return(["pathogen_list_v0"])
    end

    describe "GET show" do
      it "should return not found error if no list version exists" do
        get :show
        expect(response).to have_http_status :not_found

        json_response = JSON.parse(response.body)
        expect(json_response).to eq({})
      end

      it "should return the latest pathogen list version if version unspecified" do
        list_version = create(:pathogen_list_version, version: "0.1.0", pathogen_list_id: @global_list.id)
        list_version.pathogens << @pathogen_a
        list_version.pathogens << @pathogen_b

        expected = {
          pathogens: list_version.fetch_pathogens_info,
          citations: list_version.fetch_citation_footnotes,
        }

        get :show
        expect(response).to have_http_status :ok

        json_response = JSON.parse(response.body, { symbolize_names: true })
        expect(json_response).to eq(expected)
      end

      it "should return the correct pathogen list version if version specified" do
        create(:pathogen_list_version, version: "0.1.1", pathogen_list_id: @global_list.id)
        old_list_version = create(:pathogen_list_version, version: "0.1.0", pathogen_list_id: @global_list.id)
        old_list_version.pathogens << @pathogen_a

        expected = {
          pathogens: old_list_version.fetch_pathogens_info,
          citations: old_list_version.fetch_citation_footnotes,
        }

        get :show, params: { version: "0.1.0" }
        expect(response).to have_http_status :ok

        json_response = JSON.parse(response.body, { symbolize_names: true })
        expect(json_response).to eq(expected)
      end
    end
  end

  context "when the feature is not launched" do
    describe "GET show" do
      it "should redirect to page not found path" do
        get :show
        expect(response).to redirect_to page_not_found_path
      end
    end
  end
end
