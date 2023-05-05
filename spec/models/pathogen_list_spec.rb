require 'rails_helper'

RSpec.describe PathogenList, type: :model do
  context "#parse_pathogen_list_csv" do
    subject { PathogenList.parse_input_file_csv("test_bucket", "test_filepath", ["Species", "taxID"]) }

    before do
      @mock_aws_clients = {
        s3: Aws::S3::Client.new(stub_responses: true),
      }

      allow(AwsClient).to receive(:[]) { |client|
        @mock_aws_clients[client]
      }
    end

    it "should raise an error if required headers are missing" do
      missing_header_csv = CSV.generate do |csv|
        csv << ["taxID"]
        csv << ["1"]
      end
      pathogens = CSV.parse(missing_header_csv, headers: true)
      allow(CSV).to receive(:parse).and_return(pathogens)

      expect { subject }.to raise_error(PathogenListHelper::UPDATE_PROCESS_FAILED)
    end

    it "should return the correct pathogens if required headers present" do
      test_csv = CSV.generate do |csv|
        csv << ["Species", "taxID"]
        csv << ["species_a", "1"]
      end

      pathogens = CSV.parse(test_csv, headers: true)
      allow(CSV).to receive(:parse).and_return(pathogens)

      result = subject
      expect(result).to eq(pathogens.map(&:to_h))
    end
  end

  context "#fetch_list_version" do
    before do
      @global_list = create(:pathogen_list, creator_id: nil, is_global: true)
      @version_a = create(:pathogen_list_version, version: "0.1.0", pathogen_list_id: @global_list.id)
      @version_b = create(:pathogen_list_version, version: "0.1.1", pathogen_list_id: @global_list.id)
    end

    it "should return the latest version if no version is specified" do
      result = @global_list.fetch_list_version()
      expect(result).to eq(@version_b)
    end

    it "should return the correct version if a version is specified" do
      result = @global_list.fetch_list_version("0.1.0")
      expect(result).to eq(@version_a)
    end

    it "should return nul if a non-existant version is specified" do
      result = @global_list.fetch_list_version("0.2.0")
      expect(result).to be_nil
    end
  end
end
