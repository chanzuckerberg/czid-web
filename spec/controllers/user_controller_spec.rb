require "rails_helper"

RSpec.describe UsersController, type: :controller do
  create_users

  before do
    # We don't want our tests invoking real auth0 client
    @auth0_management_client_double = double("Auth0Client")
    allow(Auth0UserManagementHelper).to receive(:auth0_management_client).and_return(@auth0_management_client_double)
  end

  # Admin specific behavior
  context "Admin user" do
    before do
      sign_in @admin
    end

    describe "create user" do
      let(:created_user) { create(:user, **fake_user_data[:user]) }

      subject do
        post :create, params: { format: "json", **fake_user_data, send_activation: false }
      end

      before do
        allow(UserFactoryService).to receive(:call).and_return(created_user)
      end

      let(:fake_user_data) do
        { user: { role: 0,
                  email: "test_user@czid.org",
                  institution: "Test institution",
                  name: "Test User Name", } }
      end

      it "calls UserFactoryService to create user" do
        expect(UserFactoryService).to receive(:call)
        subject
      end

      it "returns a successful HTTP response" do
        subject
        expect(response).to have_http_status(:success)
      end

      it "redirects to edit user path" do
        expect(subject).to render_template "show"
      end

      context "when a Net::SMTPAuthenticationError is raised" do
        it "responds with the error" do
          allow(UserFactoryService).to receive(:call).and_raise(Net::SMTPAuthenticationError, "test UserFactoryService Net::SMTPAuthenticationError")
          subject
          parsed_body = JSON.parse(response.body)
          puts "parsed_body: #{parsed_body}"
          expect(parsed_body).to eq(
            ["User was successfully created but SMTP email is not configured. Try manual password reset at #{request.base_url}#{users_password_new_path} To enable SMTP, set environment variables for SMTP_USER and SMTP_PASSWORD."]
          )
        end
      end

      context "when a different error is raised" do
        it "responds with the error" do
          allow(UserFactoryService).to receive(:call).and_raise("UserFactoryService error")
          subject
          parsed_body = JSON.parse(response.body)
          puts "parsed_body: #{parsed_body}"
          expect(parsed_body).to eq(["UserFactoryService error"])
        end
      end
    end
  end
end

RSpec.describe UsersController, type: :request do
  create_users

  before do
    # We don't want our tests invoking real auth0 client
    @auth0_management_client_double = double("Auth0Client")
    allow(Auth0UserManagementHelper).to receive(:auth0_management_client).and_return(@auth0_management_client_double)
  end

  context "Non Admin User" do
    before do
      # @host_genome = host_genomes(:one)
      sign_in @joe
    end

    it "shouldnt get index" do
      get users_url
      assert_redirected_to root_url
    end

    it "shouldnt get new" do
      get new_user_url
      assert_redirected_to root_url
    end

    it "shouldnt should get edit" do
      get edit_user_url(@joe)
      assert_redirected_to root_url
    end

    it "shouldnt destroy user" do
      delete user_url(@joe)
      assert_redirected_to root_url
    end

    it "shouldnt create user " do
      post users_url, params: { user: { email: "test@gmail.com", password: "password3", password_confirmation: "password3" } }
      assert_redirected_to root_url
    end

    context "with AppConfig::AUTO_ACCOUNT_CREATION_V1 disabled" do
      it "shouldn't update user" do
        AppConfigHelper.set_app_config(AppConfig::AUTO_ACCOUNT_CREATION_V1, "")
        post update_user_data_user_url @joe, params: { user: { name: "abc xyz" } }
        expect(response).to have_http_status :forbidden
        expect(JSON.parse(response.body, symbolize_names: true)[:message]).to eq("Nonadmin users are not allowed to modify user info")
      end
    end

    context "with AppConfig::AUTO_ACCOUNT_CREATION_V1 enabled" do
      it "should update user" do
        AppConfigHelper.set_app_config(AppConfig::AUTO_ACCOUNT_CREATION_V1, "1")
        expect(Auth0UserManagementHelper).to receive(:patch_auth0_user).with(old_email: @joe.email, email: @joe.email, name: "abc xyz", role: @joe.role)
        post update_user_data_user_url @joe, params: { user: { name: "abc xyz", email: @joe.email } }
        @joe.reload
        expect(@joe.name).to eq("abc xyz")
      end

      it "shouldn't update a different user's info" do
        AppConfigHelper.set_app_config(AppConfig::AUTO_ACCOUNT_CREATION_V1, "1")
        post update_user_data_user_url @admin, params: { user: { name: "abc xyz", email: @admin.email } }
        expect(response).to have_http_status :forbidden
        expect(JSON.parse(response.body, symbolize_names: true)[:message]).to eq("Users are not allowed to modify other users' info")
      end

      it "should send user profile data to AirTable" do
        AppConfigHelper.set_app_config(AppConfig::AUTO_ACCOUNT_CREATION_V1, "1")
        # Params from user profile form
        form_params = {
          first_name: @joe.first_name,
          last_name: @joe.last_name,
          ror_institution: "Fake Institution",
          ror_id: "1234",
          country: "United States",
          world_bank_income: "10000",
          czid_usecase: ["medical detective"],
          expertise_level: "expert",
          referral_source: ["conference"],
          signup_path: "landing page",
        }

        # Params for UsersController#update endpoint
        sign_up_params = {
          name: "abc xyz",
          email: @joe.email,
          profile_form_version: 2,
        }.merge(form_params)

        # Expected parameters for posting to AirTable
        airtable_params = {
          user_id: @joe.id,
          admin: @joe.admin?,
          email: @joe.email,
          date_created: @joe.created_at.strftime("%Y-%m-%d"),
          quarter_year: UsersHelper.calculate_quarter_year,
          survey_version: "2",
        }.merge(form_params)

        expect(MetricUtil).to receive(:post_to_airtable).with(
          "TEST - CZ ID User Profiles", # TODO: replace this with the actual table name
          { fields: airtable_params, typecast: true }.to_json
        )

        params = { user: sign_up_params }
        post post_user_data_to_airtable_user_url @joe, params: params

        expect(response).to have_http_status :ok
      end
    end
  end

  # Host Genomes
  context "Host Genomes" do
    before do
      sign_in @joe
      @host_genome = create(:host_genome, id: 1, user_id: @joe.id)
    end

    it "host genome -non admin shouldnt get new" do
      get new_host_genome_url
      assert_redirected_to root_url
    end

    it "host genome -non admin shouldnt get show" do
      get host_genome_url(@host_genome)
      assert_redirected_to root_url
    end

    it "host genome -non admin shouldnt get edit" do
      get edit_host_genome_url(@host_genome)
      assert_redirected_to root_url
    end

    it "host genome -non admin shouldnt update " do
      put host_genome_url @host_genome, params: { host_genome: { name: "abc xyz" } }
      assert_redirected_to root_url
    end

    it "host genome -non admin shouldnt destroy " do
      delete host_genome_url(@host_genome)
      assert_redirected_to root_url
    end

    it "host genome -non admin shouldnt create " do
      post host_genomes_url, params: { host_genome: { name: "dsfsdfd" } }
      assert_redirected_to root_url
    end
  end

  context "Background" do
    before do
      @background = create(:background)
      sign_in @joe
    end

    it " background -non admin shouldnt get new" do
      get new_background_url
      assert_redirected_to root_url
    end

    it " background -non admin shouldnt get show" do
      get background_url(@background)
      assert_redirected_to root_url
    end

    it " background -non admin shouldnt should get edit" do
      get edit_background_url(@background)
      assert_redirected_to root_url
    end

    it " background -non admin shouldnt update " do
      put background_url @background, params: { background: { name: "abc xyz" } }
      assert_redirected_to root_url
    end

    it " background -non admin shouldnt destroy " do
      delete background_url(@background)
      assert_redirected_to root_url
    end
  end
end
