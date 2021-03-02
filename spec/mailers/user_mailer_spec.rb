require "rails_helper"

RSpec.describe UserMailer, type: :mailer do
  let(:regular_user) { create(:user) }

  let(:project_1) { create(:project) }
  let(:project_2) { create(:project) }

  let(:sample_1) { create(:sample, project: project_1, user: regular_user) }
  let(:sample_2) { create(:sample, project: project_1, user: regular_user) }
  let(:sample_3) { create(:sample, project: project_2, user: regular_user) }

  describe "#sample_visibility_reminder" do
    it "correctly formats the email template for the user" do
      _ = [sample_1, sample_2, sample_3]

      mail = UserMailer.sample_visibility_reminder(
        email: regular_user.email,
        name: regular_user.name,
        period_name: "April 2021",
        projects: Project.all,
        samples_by_project_id: Sample.all.group_by(&:project_id),
        total_count: 10
      )
      mail = mail.message.body.to_s

      expect(mail).to include(
        "Hi #{regular_user.name},",
        "will become visible to other users in <b>April 2021</b>",
        "2 samples in project <a href=",
        "my_data?projectId=#{project_1.id}\">#{project_1.name}</a><br />",
        "1 samples in project <a href=",
        "my_data?projectId=#{project_2.id}\">#{project_2.name}</a><br />"
      )
    end
  end
end
