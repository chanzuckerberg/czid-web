require "rails_helper"

Rails.application.load_tasks

describe "delete_never_used_accounts" do
  before do
    allow($stdout).to receive(:puts)
  end

  after(:each) do
    Rake::Task["delete_never_used_accounts"].reenable
  end

  subject { Rake::Task["delete_never_used_accounts"].invoke("noverify") }

  context "when there are accounts to delete" do
    it "deletes only the accounts with matching criteria" do
      user1 = create(:user, created_at: 50.days.ago)
      user2 = create(:user, created_at: 50.days.ago)
      user3 = create(:user, created_at: 10.days.ago)
      user4 = create(:user, created_at: 10.days.ago, sign_in_count: 1)

      expect(Auth0UserManagementHelper).to receive(:delete_auth0_user).with(email: user1.email)
      expect(Auth0UserManagementHelper).to receive(:delete_auth0_user).with(email: user2.email)

      subject

      expect(User.where(id: [user1.id, user2.id])).to be_empty
      expect(User.find(user3.id)).to be_truthy
      expect(User.find(user4.id)).to be_truthy
    end

    it "raises an error if the sanity check fails" do
      user1 = create(:user, created_at: 50.days.ago)
      project = create(:project, name: "Fake Project")
      create(:sample, user: user1, project: project)

      expect { subject }.to raise_error(RuntimeError)
    end
  end

  context "when there are no accounts to delete" do
    it "exits and does nothing" do
      user1 = create(:user, created_at: 10.days.ago)
      user2 = create(:user, sign_in_count: 1)

      expect { subject }.to raise_error(RuntimeError)

      expect(User.find(user1.id)).to be_truthy
      expect(User.find(user2.id)).to be_truthy
    end
  end
end
