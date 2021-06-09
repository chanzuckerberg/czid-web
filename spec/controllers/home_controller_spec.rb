require "rails_helper"

RSpec.describe HomeController, type: :controller do
  create_users

  context "non signed-in user" do
    describe "GET landing" do
      it "returns the landing page" do
        get :landing, { format: "html" }

        expect(response).to have_http_status :ok
        expect(response.body).to render_template("landing")
      end
    end

    describe "POST sign_up" do
      it "accepts account request form submissions" do
        expect(UserMailer).to receive(:account_request_reply).and_call_original
        expect(UserMailer).to receive(:landing_sign_up_email).and_call_original

        params = { signUp: { firstName: "Joe", lastName: "Schmoe", email: "fake@idseq.net", institution: "Fake Institution", usage: "I love metagenomics" } }
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
end
