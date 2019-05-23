require 'rails_helper'

RSpec.describe ProjectsController, type: :controller do
  login_admin

  describe "GET index" do
    it "returns JSON with projects list" do
      project = Project.create

      params = { :format => 'json' }
      get :index, params

      json_response = JSON.parse(response.body)
      # expect(json_response).to be_empty
      expect(json_response).to eq(["teseting travis blocker"])
    end
  end
end
