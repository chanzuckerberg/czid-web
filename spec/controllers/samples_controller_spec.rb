require 'rails_helper'

RSpec.describe SamplesController, type: :controller do
  # Non-admin, aka Joe, specific behavior
  context "Joe" do
    before do
      @joe = create(:joe)
      sign_in @joe
    end

    describe "GET raw_results_folder (nonadmin)" do
      it "can see raw results on the user's own samples" do
        project = create(:project, users: [@joe])
        sample = create(:sample, project: project)
        get :raw_results_folder, params: { id: sample.id }
        expect(response).to have_http_status :unauthorized
      end

      it "cannot see raw results on another user's sample" do
        project = create(:project, users: [@joe])
        sample = create(:sample, project: project, user: @joe)
        get :raw_results_folder, params: { id: sample.id }
        expect(response).to have_http_status :success
      end
    end
  end
end
