require 'rails_helper'

RSpec.describe HostGenomesController, type: :controller do
  before do
    create(:host_genome)
  end

  describe "GET index" do
    before do
      sign_in @joe
    end

    it "includes ercc_only and showAsOption in json response" do
      get :index, format: :json
      expect(response).to have_http_status(:ok)
      json_response = JSON.parse(response.body)
      expect(json_response[0].keys).to include("id", "name", "showAsOption", "ercc_only")
    end
  end

  describe "GET index_public" do
    it "allows access by non-signed in users" do
      get :index_public
      expect(response).to have_http_status(:ok)
    end

    it "only returns select fields" do
      get :index_public
      expect(response).to have_http_status(:ok)
      json_response = JSON.parse(response.body)
      expect(json_response[0].keys).to eq(["id", "name", "showAsOption"])
    end
  end
end
