require 'rails_helper'

RSpec.describe PlaygroundController, type: :controller do

  describe "GET #threshold_dropdown" do
    it "returns http success" do
      get :threshold_dropdown
      expect(response).to have_http_status(:success)
    end
  end

end
