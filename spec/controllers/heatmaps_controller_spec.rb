require 'rails_helper'

RSpec.describe HeatmapsController, type: :controller do
  describe "GET #project" do
    it "returns http success" do
      get :project
      expect(response).to have_http_status(:success)
    end
  end
end
