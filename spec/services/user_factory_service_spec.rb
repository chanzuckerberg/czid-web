require 'rails_helper'

RSpec.describe UserFactoryService do
  let!(:admin_user) { create(:admin) }
  let(:new_user_email) { "user_factory_user@email.com" }
  let(:new_user_name) { "UserFactory User" }
  let(:project_id) { nil }
  let(:send_activation) { false }
  let(:signup_path) { nil }
  let(:new_user_params) do
    {
      name: new_user_name,
      email: new_user_email,
      role: 1,
      created_by_user_id: admin_user.id,
    }
  end

  let(:auth0_user_id) { "1" }

  let(:user_factory_instance) do
    described_class.new(
      current_user: admin_user,
      project_id: project_id,
      send_activation: send_activation,
      signup_path: signup_path,
      created_by_user_id: admin_user.id,
      **new_user_params
    )
  end

  before do
    allow(MetricUtil).to receive(:post_to_airtable)
    allow(Auth0UserManagementHelper).to receive(:create_auth0_user).and_return(
      { "user_id" => auth0_user_id }
    )
  end

  context "when create is not successful" do
    before do
      allow(User).to receive(:create!).and_raise(ActiveRecord::RecordInvalid)
    end

    it "does not add a new user" do
      expect { user_factory_instance.call }.to raise_error(ActiveRecord::RecordInvalid).and change { User.count }.by(0)
      expect(User.last.id).to eq(admin_user.id)
    end

    it "logs an error" do
      expect(LogUtil).to receive(:log_error)
      expect { user_factory_instance.call }.to raise_error(ActiveRecord::RecordInvalid)
    end
  end

  context "when create is successful" do
    context "when new user name is not nil" do
      it "adds a new user" do
        expect { user_factory_instance.call }.to change { User.count }.by(1)
        expect(User.last.name).to eq(new_user_name)
        expect(User.last.email).to eq(new_user_email)
      end
    end

    context "when new user name is nil" do
      let(:new_user_name) { nil }

      it "adds a new user" do
        expect { user_factory_instance.call }.to change { User.count }.by(1)
        expect(User.last.name).to eq(new_user_name)
        expect(User.last.email).to eq(new_user_email)
      end
    end

    context "when new user email has capital letters" do
      let(:new_user_email) { "CAPITAL_letters@EmAil.com" }
      it "downcases the email" do
        user_factory_instance.call
        expect(User.last.email).to eq("capital_letters@email.com")
      end
    end

    context "when new_user_params includes a profile_form_version" do
      let(:new_user_params) do
        {
          name: new_user_name,
          email: new_user_email,
          role: 0,
          created_by_user_id: admin_user.id,
          profile_form_version: User::PROFILE_FORM_VERSION[:interest_form],
        }
      end

      it "adds a new user with the profile_form_version" do
        user_factory_instance.call
        expect(User.last.profile_form_version).to eq(User::PROFILE_FORM_VERSION[:interest_form])
      end
    end
  end

  context "#record_new_user_in_airtable" do
    let(:airtable_accounts_table) { "CZ ID Accounts" }

    context "when signup is through admin-settings" do
      let(:signup_path) { User::SIGNUP_PATH[:general] }

      it "make API call to add info to airtable with General signupPath" do
        user_factory_instance.call
        created_user = User.last
        airtable_data = {
          fields: {
            name: created_user.name,
            email: created_user.email,
            signupPath: User::SIGNUP_PATH[:general],
            userId: created_user.id,
          },
        }

        expect(MetricUtil).to have_received(:post_to_airtable)
          .with(airtable_accounts_table, airtable_data.to_json)
      end
    end

    context "when signup is through a project" do
      let(:new_user_name) { nil }
      let(:project_id) { create(:project).id }
      let(:signup_path) { User::SIGNUP_PATH[:project] }

      it "make API call to add info to airtable with Project signupPath" do
        user_factory_instance.call
        created_user = User.last
        airtable_data = {
          fields: {
            name: created_user.name,
            email: created_user.email,
            signupPath: User::SIGNUP_PATH[:project],
            userId: created_user.id,
          },
        }

        expect(MetricUtil).to have_received(:post_to_airtable)
          .with(airtable_accounts_table, airtable_data.to_json)
      end
    end

    context "when signup is through the landing page" do
      let(:new_user_name) { nil }
      let(:signup_path) { User::SIGNUP_PATH[:self_registered] }

      it "make API call to add info to airtable with Self-registered signupPath" do
        user_factory_instance.call
        created_user = User.last
        airtable_data = {
          fields: {
            name: created_user.name,
            email: created_user.email,
            signupPath: User::SIGNUP_PATH[:self_registered],
            userId: created_user.id,
          },
        }

        expect(MetricUtil).to have_received(:post_to_airtable)
          .with(airtable_accounts_table, airtable_data.to_json)
      end
    end

    context "when airtable signup raises an error" do
      before do
        allow(MetricUtil).to receive(:post_to_airtable).and_raise("airtable error")
      end

      it "logs error" do
        expect(LogUtil).to receive(:log_error)
        user_factory_instance.call
      end
    end
  end

  context "#create_auth0_user_and_save_user_id" do
    context "when new user name is not nil" do
      it "creates auth0 user" do
        user_factory_instance.call
        created_user = User.last

        expect(Auth0UserManagementHelper).to have_received(:create_auth0_user).with(
          email: created_user.email,
          name: created_user.name,
          role: created_user.role
        )
      end
    end

    context "when new user name is nil" do
      let(:new_user_name) { nil }

      it "creates auth0 user" do
        user_factory_instance.call
        created_user = User.last

        expect(Auth0UserManagementHelper).to have_received(:create_auth0_user).with(
          email: created_user.email,
          name: created_user.name,
          role: created_user.role
        )
      end
    end

    it "sets auth0_user_id from response" do
      user_factory_instance.call
      expect(user_factory_instance.auth0_user_id).to eq(auth0_user_id)
    end

    context "when create auth0 user raises an error" do
      before do
        allow(Auth0UserManagementHelper).to receive(:create_auth0_user).and_raise("auth0 error")
      end

      it "logs error and does not create a user" do
        expect(LogUtil).to receive(:log_error)
        expect { user_factory_instance.call }.to raise_error("auth0 error") and change { User.count }.by(0)
      end
    end
  end

  context "#send_activation_email" do
    context "when send_activation is false" do
      it "does not call send_activation_email" do
        user_factory_instance.call
        expect(Auth0UserManagementHelper).not_to receive(:get_auth0_password_reset_token)
      end
    end

    context "when send_activation is true" do
      let(:send_activation) { true }
      let(:auth0_reset_url) { "auth0_ticket_reset_url" }

      before do
        allow(Auth0UserManagementHelper).to receive(:get_auth0_password_reset_token).and_return(
          { "ticket" => auth0_reset_url }
        )
        email_message = instance_double(ActionMailer::MessageDelivery)
        allow(email_message).to receive(:deliver_now)
        allow(UserMailer).to receive(:new_auth0_user_new_project).and_return(email_message)
        allow(UserMailer).to receive(:account_activation).and_return(email_message)
      end

      it "gets auth0 reset token" do
        expect(Auth0UserManagementHelper).to receive(:get_auth0_password_reset_token)
        user_factory_instance.call
      end

      context "when project_id is nil" do
        it "calls UserMail.account_activate to send activation email" do
          expect(UserMailer).not_to receive(:new_auth0_user_new_project)

          user_factory_instance.call
          created_user = User.last

          expect(UserMailer).to have_received(:account_activation)
            .with(
              created_user.email,
              auth0_reset_url
            )
        end
      end

      context "when project_id is set" do
        let(:project_id) { create(:project).id }

        it "calls UserMail.new_auth0_user_new_project to send activation email" do
          expect(UserMailer).not_to receive(:account_activation)

          user_factory_instance.call
          created_user = User.last

          expect(UserMailer).to have_received(:new_auth0_user_new_project).with(
            admin_user,
            created_user.email,
            project_id,
            auth0_reset_url
          )
        end
      end

      context "when send activation email raises an error" do
        before do
          allow(UserMailer).to receive(:account_activation).and_raise(Net::SMTPAuthenticationError, "test UserMailer error")
        end

        it "logs error" do
          expect(LogUtil).to receive(:log_error)
          expect { user_factory_instance.call }.to raise_error(Net::SMTPAuthenticationError)
        end
      end
    end
  end
end
