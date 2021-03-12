require 'rails_helper'
require_relative '../../test/test_helpers/location_test_helper'

RSpec.describe LocationsController, type: :controller do
  create_users

  context "non-admin user" do
    before do
      @our_results = LocationTestHelper::FORMATTED_GEOSEARCH_RESPONSE
      @api_response = true, LocationTestHelper::API_GEOSEARCH_RESPONSE
      sign_in @joe
    end

    describe "GET external_search" do
      it "gives user geosearch results" do
        allow(Location).to receive(:geo_search_request_base).and_return(@api_response)
        get :external_search, params: { query: "UCSF" }
        expect(response).to have_http_status(:success)
        expect(JSON.dump(@our_results)).to eq(response.body)
      end

      it "gives user a geosearch without results" do
        allow(Location).to receive(:geo_search_request_base).and_return([true, []])
        get :external_search, params: { query: "ahsdlfkjasfk" }
        expect(response).to have_http_status(:success)
        expect(response.body).to eq("[]")

        get :external_search, params: { query: "" }
        expect(response).to have_http_status(:success)
        expect(response.body).to eq("[]")

        get :external_search
        expect(response).to have_http_status(:success)
        expect(response.body).to eq("[]")

        allow(Location).to receive(:geo_search_request_base).and_return([true, LocationTestHelper::API_NO_GEOCODE_RESPONSE])
        get :external_search, params: { query: "ahsdlfkjasfk" }
        expect(response).to have_http_status(:success)
        expect(response.body).to eq("[]")
      end

      it "gives user a geosearch without results when using ssrfs-up" do
        # We should get the same thing if we use SSRFs Up
        AppConfigHelper.set_app_config(AppConfig::ENABLE_SSRFS_UP, "1")
        allow(Location).to receive(:geo_search_request_base).and_return([true, []])
        get :external_search, params: { query: "ahsdlfkjasfk" }
        expect(response).to have_http_status(:success)
        expect(response.body).to eq("[]")

        get :external_search, params: { query: "" }
        expect(response).to have_http_status(:success)
        expect(response.body).to eq("[]")

        get :external_search
        expect(response).to have_http_status(:success)
        expect(response.body).to eq("[]")

        allow(Location).to receive(:geo_search_request_base).and_return([true, LocationTestHelper::API_NO_GEOCODE_RESPONSE])
        get :external_search, params: { query: "ahsdlfkjasfk" }
        expect(response).to have_http_status(:success)
        expect(response.body).to eq("[]")
      end
    end
  end
end
