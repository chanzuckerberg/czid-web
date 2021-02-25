require "rails_helper"

RSpec.describe SendSampleVisibilityEmail, type: :job do
  let(:feature_name) { SendSampleVisibilityEmail::SAMPLE_VISIBILITY_EMAIL_FEATURE }

  let(:admin_user) { create(:user, role: 1) }
  let(:beta_user) { create(:user, allowed_features: [feature_name].to_json) }
  let(:regular_user) { create(:user) }

  let(:project_1) { create(:project) }
  let(:project_2) { create(:project) }

  let(:sample_1) { create(:sample, project: project_1, user: regular_user) }
  let(:sample_2) { create(:sample, project: project_1, user: regular_user) }
  let(:sample_3) { create(:sample, project: project_2, user: regular_user) }
  let(:sample_4) { create(:sample, project: project_2, user: beta_user) }

  subject { SendSampleVisibilityEmail }

  describe "#perform" do
    it "correctly dispatches emails to each user with samples going public" do
      _ = [sample_1, sample_2, sample_3, sample_4]
      expect(subject).to receive(:find_eligible_samples).and_return(Sample.all)
      expect(subject).to receive(:find_eligible_users).and_return(User.all)

      expect(subject).to receive(:prepare_individual_emails).with(beta_user, beta_user.samples)
      expect(subject).to receive(:prepare_individual_emails).with(regular_user, regular_user.samples)
      expect(subject.perform).to eq(true)
    end

    it "exits properly when there are no matching samples" do
      expect(subject).to receive(:find_eligible_samples).and_return(Sample.none)

      expect(subject.perform).to eq(subject::NO_ELIGIBLE_SAMPLES)
    end

    it "exits properly when there are no users with the feature" do
      expect(subject).to receive(:find_eligible_samples).and_return([sample_1])
      expect(subject).to receive(:find_eligible_users).and_return(User.none)

      expect(subject.perform).to eq(subject::NO_ELIGIBLE_USERS)
    end

    it "exits properly when there are no users with samples going public" do
      expect(subject).to receive(:find_eligible_samples).and_return([sample_1])
      expect(subject).to receive(:find_eligible_users).and_return(User.where(id: beta_user.id))

      expect(subject.perform).to eq(subject::NO_ELIGIBLE_USERS)
    end
  end

  describe "#find_eligible_samples" do
    it "requests samples going public in the correct time period" do
      next_month = Time.zone.today.next_month
      start = next_month.at_beginning_of_month
      finish = next_month.at_end_of_month
      expect(Sample).to receive(:samples_going_public_in_period).with([start, finish]).and_return([sample_1])

      expect(subject.find_eligible_samples).to eq([sample_1])
    end
  end

  describe "#find_eligible_users" do
    context "when the feature is launched" do
      before do
        expect(AppConfigHelper).to receive(:get_json_app_config).and_return([feature_name])
      end

      it "returns all users" do
        expected = [admin_user, beta_user, regular_user]

        expect(subject.find_eligible_users.pluck(:id)).to match_array(expected.pluck(:id))
      end
    end

    context "when the feature is in beta" do
      it "returns only admins and beta users" do
        expected = [admin_user.id, beta_user.id]

        expect(subject.find_eligible_users.pluck(:id)).to match_array(expected)
      end
    end
  end

  describe "#prepare_individual_emails" do
    it "correctly groups the samples by project" do
      _ = [sample_1, sample_2, sample_3]
      user_samples = regular_user.samples

      actual = subject.prepare_individual_emails(regular_user, user_samples)
      expect(actual.keys).to match_array(user_samples.pluck(:project_id).uniq)
      expect(actual[project_1.id].pluck(:id)).to match_array([sample_1.id, sample_2.id])
      expect(actual[project_2.id].pluck(:id)).to match_array([sample_3.id])
    end
  end
end
