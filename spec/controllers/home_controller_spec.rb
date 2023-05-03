require "rails_helper"
require "support/authorization_examples"

RSpec.describe HomeController, type: :controller do
  create_users

  describe '#check_profile_form_completion' do
    context 'when the current user has not completed the profile form' do
      let(:user) { create(:user, profile_form_version: 0) }

      before do
        sign_in(user)
        get :index
      end

      it 'redirects to the profile form page' do
        expect(response).to redirect_to(user_profile_form_path)
      end
    end

    context 'when the current user has completed the profile form' do
      let(:user) { create(:user, profile_form_version: 1) }

      before do
        sign_in(user)
        get :index
      end

      it 'redirects to my_data' do
        expect(response).to redirect_to(my_data_path)
      end
    end
  end

  context "non signed-in user" do
    describe "GET landing" do
      it "returns the landing page" do
        get :landing, params: { format: "html" }

        expect(response).to have_http_status :ok
        expect(response.body).to render_template("landing")
      end
    end

    describe "POST sign_up" do
      it "accepts account request form submissions" do
        sign_up_params = {
          firstName: "Joe",
          lastName: "Schmoe",
          email: "fake@czid.org",
          institution: "Fake Institution",
          usage: "I love metagenomics",
        }
        expect(UserMailer).to receive(:account_request_reply).and_call_original
        expect(UserMailer).to receive(:landing_sign_up_email).and_call_original
        expect(MetricUtil).to receive(:post_to_airtable).with(
          "Landing Page Form",
          { fields: sign_up_params }.to_json
        )

        params = { signUp: sign_up_params }
        post :sign_up, params: params

        expect(response).to have_http_status :success
      end
    end
  end

  context "signed-in user" do
    before do
      sign_in @joe
    end

    describe "GET landing" do
      subject { get :landing }

      it "redirects to the logged-in discovery view" do
        expect(subject).to redirect_to home_path

        expect(response).to have_http_status :redirect
      end
    end
  end

  shared_examples "sanitizes_project_id" do |controller_action|
    before do
      sign_in @admin
    end

    context "when no project_id is passed" do
      subject { get controller_action }

      it "sets @project_id to null" do
        subject
        expect(assigns(:project_id)).to eq(nil)
      end
    end

    context "when a project_id is passed" do
      subject { get controller_action, params: { project_id: project_id } }

      context "when the project_id is not numeric" do
        let(:project_id) { "alert(123)" }

        it "sets @project_id to null if project_id param is string" do
          subject
          expect(assigns(:project_id)).to eq(nil)
        end
      end

      context "when the project_id is numeric but not a valid project ID" do
        let(:project_id) { "-1" }

        it "sets @project_id to null if project_id param is string" do
          subject
          expect(assigns(:project_id)).to eq(nil)
        end
      end

      context "when project_id is a valid project id" do
        let(:project) { create(:project) }
        let(:project_id) { project.id.to_s }

        it "sets @project_id to passed project_id" do
          subject
          expect(assigns(:project_id)).to eq(project_id.to_s)
        end
      end
    end
  end

  context "#all_data" do
    context "admin required" do
      subject { get :all_data }

      it_behaves_like "admin_required_endpoint"
    end

    it_behaves_like "sanitizes_project_id", :all_data
  end

  context "#my_data" do
    context "login required" do
      subject { get :my_data }
      it_behaves_like "login_required_endpoint"
    end

    it_behaves_like "sanitizes_project_id", :my_data
  end

  context "#public" do
    context "login required" do
      subject { get :public }
      it_behaves_like "login_required_endpoint"
    end

    it_behaves_like "sanitizes_project_id", :public
  end
end
