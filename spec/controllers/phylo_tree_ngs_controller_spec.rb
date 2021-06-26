require 'rails_helper'

RSpec.describe PhyloTreeNgsController, type: :controller do
  describe "GET validate_name" do
    before do
      joe = create(:joe)
      sign_in joe

      create(:phylo_tree_ng, name: "existing_name")
    end

    context "with unique name" do
      it "is valid" do
        name = "unique_name"

        get :validate_name, params: { format: "json", name: name }

        json_response = JSON.parse(response.body)
        expect(json_response).to include_json(valid: true, sanitizedName: name)
      end
    end

    context "with duplicate name" do
      it "is valid" do
        name = "existing_name"

        get :validate_name, params: { format: "json", name: name }

        json_response = JSON.parse(response.body)
        expect(json_response).to include_json(valid: true, sanitizedName: name)
      end
    end

    context "with duplicate name after sanitization" do
      it "is valid" do
        unsanitized_name = "sanitize/ name'"
        sanitized_name = "sanitize  name"

        get :validate_name, params: { format: "json", name: unsanitized_name }

        json_response = JSON.parse(response.body)
        expect(json_response).to include_json(valid: true, sanitizedName: sanitized_name)
      end
    end

    context "with empty name" do
      it "is not valid" do
        name = ""

        get :validate_name, params: { format: "json", name: name }

        json_response = JSON.parse(response.body)
        expect(json_response).to include_json(valid: false, sanitizedName: name)
      end
    end
  end

  describe "PUT rerun" do
    let(:phylo_tree) { create(:phylo_tree_ng) }

    context "from regular user" do
      before do
        joe = create(:joe)
        sign_in joe
      end

      it "redirects the user" do
        put :rerun, params: { id: phylo_tree.id }

        expect(response).to have_http_status(:redirect)
      end
    end

    context "from admin user" do
      before do
        admin = create(:admin)
        sign_in admin
      end

      it "calls rerun on the phylo tree" do
        create(:app_config, key: AppConfig::SFN_SINGLE_WDL_ARN, value: "fake-arn")
        create(:app_config, key: format(AppConfig::WORKFLOW_VERSION_TEMPLATE, workflow_name: "phylotree-ng"), value: "0.0.1")

        put :rerun, params: { id: phylo_tree.id }

        expect(response).to have_http_status(:success)
      end

      it "returns an error if the phylo tree is not found" do
        put :rerun, params: { id: 0 }

        expect(response).to have_http_status(:internal_server_error)
      end

      it "returns an error if the rerun dispatch fails" do
        put :rerun, params: { id: phylo_tree.id }

        expect(response).to have_http_status(:internal_server_error)
      end
    end
  end
end
