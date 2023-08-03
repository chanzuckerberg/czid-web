require "rails_helper"

RSpec.describe DeleteUnclaimedUserAccounts, type: :job do
  before do
    # Create some unclaimed user accounts
    create(:user, created_at: Time.now.utc - 30.days, email: "user1@test.com")
    create(:user, created_at: Time.now.utc - 21.days, email: "user2@test.com")
    create(:user, created_at: Time.now.utc, email: "user3@test.com")

    mock_unverified_auth0_users_response = [
      { auth0_user_id: "1", email: "user1@test.com" },
      { auth0_user_id: "2", email: "user2@test.com" },
    ]
    allow(Auth0UserManagementHelper).to receive(:unverified_auth0_users).and_return(mock_unverified_auth0_users_response)
  end

  context "when account-deletion appconfig is disabled" do
    before do
      # monitor mode
      AppConfigHelper.set_app_config(AppConfig::ENABLE_DELETE_UNCLAIMED_USER_ACCOUNTS, "0")
    end

    context "when no errors occur" do
      it "should log the number of unclaimed user accounts" do
        expect(LogUtil).to receive(:log_message).with("Found 2 unclaimed user accounts in Auth0")
        DeleteUnclaimedUserAccounts.perform
      end

      it "should not delete unclaimed user accounts" do
        expect { DeleteUnclaimedUserAccounts.perform }.not_to change(User, :count)
      end

      it "should not log errors to cloudwatch" do
        expect(LogUtil).not_to receive(:log_error)
        DeleteUnclaimedUserAccounts.perform
      end
    end

    context "when failing to retrieve unclaimed user accounts from Auth0" do
      before do
        allow(Auth0UserManagementHelper).to receive(:unverified_auth0_users).and_raise(StandardError)
      end

      it "should log an error to cloudwatch" do
        expect(LogUtil).to receive(:log_error).with(
          "Failed to retrieve unclaimed user accounts from Auth0",
          exception: StandardError
        )
        DeleteUnclaimedUserAccounts.perform
      end
    end
  end

  context "when account-deletion appconfig is enabled" do
    before do
      # deletion mode
      AppConfigHelper.set_app_config(AppConfig::ENABLE_DELETE_UNCLAIMED_USER_ACCOUNTS, "1")

      allow(Auth0UserManagementHelper).to receive(:delete_auth0_user)
    end

    context "when no errors occur" do
      it "should log the number of unclaimed user accounts" do
        expect(LogUtil).to receive(:log_message).with("Found 2 unclaimed user accounts in Auth0")
        DeleteUnclaimedUserAccounts.perform
      end

      it "should delete unclaimed user accounts" do
        expect { DeleteUnclaimedUserAccounts.perform }.to change(User, :count).by(-2)
        expect(User.all.map(&:email)).to eq(["user3@test.com"])
      end

      it "should not log errors to cloudwatch" do
        expect(LogUtil).not_to receive(:log_error)
        DeleteUnclaimedUserAccounts.perform
      end
    end

    context "when failing to retrieve unclaimed user accounts from Auth0" do
      before do
        allow(Auth0UserManagementHelper).to receive(:unverified_auth0_users).and_raise(StandardError)
      end

      it "should log an error to cloudwatch" do
        expect(LogUtil).to receive(:log_error).with(
          "Failed to retrieve unclaimed user accounts from Auth0",
          exception: StandardError
        )

        DeleteUnclaimedUserAccounts.perform
      end

      it "should not delete any accounts" do
        expect(Auth0UserManagementHelper).not_to receive(:delete_auth0_user)
        expect { DeleteUnclaimedUserAccounts.perform }.not_to change(User, :count)
      end
    end

    context "when an unclaimed account contains samples" do # this should never happen
      before do
        user1 = User.find_by(email: "user1@test.com")
        create(:sample, user: user1)
      end

      it "should not delete accounts with samples" do
        expect(Auth0UserManagementHelper).not_to receive(:delete_auth0_user).with(email: "user1@test.com")
        expect { DeleteUnclaimedUserAccounts.perform }.to change(User, :count).by(-1)

        # did not delete user1, deleted user2
        expect(User.all.map(&:email)).to eq(["user1@test.com", "user3@test.com"])
      end

      it "should log errors to cloudwatch" do
        user1 = User.find_by(email: "user1@test.com")
        expect(LogUtil).to receive(:log_error).with(
          "ERROR: The user to-be-deleted owns samples",
          exception: DeleteUnclaimedUserAccounts::DeleteUnclaimedUserAccountsError.new,
          user_id: user1.id
        )
        DeleteUnclaimedUserAccounts.perform
      end
    end

    context "when an error occurs while deleting an account from Auth0" do
      before do
        # raise error when deleting user1 from Auth0
        allow(Auth0UserManagementHelper).to receive(:delete_auth0_user).with(email: "user1@test.com").and_raise(StandardError)
      end

      it "should not delete the error-raising account from MySQL" do
        DeleteUnclaimedUserAccounts.perform
        expect(User.all.map(&:email)).to include("user1@test.com")
      end

      it "should proceed to delete all subsequent accounts" do
        # deletes user2 from Auth0
        expect(Auth0UserManagementHelper).to receive(:delete_auth0_user).with(email: "user2@test.com")

        expect { DeleteUnclaimedUserAccounts.perform }.to change(User, :count).by(-1)

        # deletes user2 from MySQL
        expect(User.all.map(&:email)).to eq(["user1@test.com", "user3@test.com"])
      end

      it "should log an error to cloudwatch" do
        expect(LogUtil).to receive(:log_error).with(
          "Failed to delete account from Auth0. Retrying tomorrow. Warning: unclaimed accounts must be deleted within 30 days of creation.",
          exception: StandardError,
          auth0_user_id: "1",
          days_since_creation: 30
        )
        DeleteUnclaimedUserAccounts.perform
      end
    end

    context "when an error occurs while deleting an account from MySQL" do
      before do
        # raise error when deleting user1
        # (assume that user1 was successfully deleted from Auth0)
        allow_any_instance_of(User).to receive(:destroy!) { |user|
          if user.email == "user1@test.com"
            raise StandardError
          else
            # call delete (instead of destroy) to prevent infinite loop
            user.delete
          end
        }
      end

      it "should proceed to delete all subsequent accounts" do
        # deletes user2 from Auth0
        expect(Auth0UserManagementHelper).to receive(:delete_auth0_user).with(email: "user2@test.com")

        expect do
          DeleteUnclaimedUserAccounts.perform
        end.to change(User, :count).by(-1)

        # deletes user2 from MySQL
        expect(User.all.map(&:email)).to eq(["user1@test.com", "user3@test.com"])
      end

      it "should log an error to cloudwatch" do
        user1 = User.find_by(email: "user1@test.com")
        expect(LogUtil).to receive(:log_error).with(
          "Failed to delete account from MySQL. Manual action required: this account must be deleted from MySQL within 30 days of creation.",
          exception: StandardError,
          user_id: user1.id,
          days_since_creation: 30
        )
        DeleteUnclaimedUserAccounts.perform
      end
    end
  end
end
