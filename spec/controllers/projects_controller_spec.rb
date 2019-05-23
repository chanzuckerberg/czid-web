require 'rails_helper'

RSpec.describe ProjectsController, type: :controller do
  login_admin

  describe "GET index" do
    it "returns JSON with projects list" do
      get :index, params: { format: 'json' }

      json_response = JSON.parse(response.body)
      expect(json_response).to be_empty
    end
  end
end
