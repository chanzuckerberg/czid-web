require "rails_helper"

describe InputFile, type: :model do
  let(:user) { create(:user) }
  let(:project) { create(:project, users: [user]) }
  let(:sample) { create(:sample, project: project) }

  context "#s3_presence_check" do
    it "returns true if head_object on the file succeeds" do
      expect(sample.input_files[0].s3_presence_check).to be true
      expect(sample.input_files[1].s3_presence_check).to be true
    end

    it "returns false if head_object on the file fails" do
      expect(S3_CLIENT).to receive(:head_object).exactly(2).times.and_raise(Aws::S3::Errors::NotFound.new(nil, nil))

      expect(sample.input_files[0].s3_presence_check).to be false
      expect(sample.input_files[1].s3_presence_check).to be false
    end
  end
end
