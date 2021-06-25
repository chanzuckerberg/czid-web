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
end
