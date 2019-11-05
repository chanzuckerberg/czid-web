require 'rails_helper'

RSpec.describe SamplesController, type: :controller do
  create_users

  # Non-admin, aka Joe, specific behavior
  context "Joe" do
    before do
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

  context "User with report_v2 flag" do
    before do
      sign_in @joe
      @joe.add_allowed_feature("report_v2")
      @project = create(:project, users: [@joe])
    end

    describe "GET show_v2" do
      it "can see sample report_v2" do
        sample = create(:sample, project: @project)
        get :show_v2, params: { id: sample.id }
        expect(response).to have_http_status :success
      end
    end
  end

  context "Admin without report_v2 flag" do
    before do
      sign_in @admin
      @project = create(:project, users: [@admin])
    end

    describe "GET show_v2" do
      it "redirected to home page" do
        sample = create(:sample, project: @project)
        get :show_v2, params: { id: sample.id }
        expect(response).to redirect_to(root_path)
      end
    end
  end
end
