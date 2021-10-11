require 'rails_helper'

RSpec.describe PathogenList, type: :model do
  before do
    @mock_aws_clients = {
      s3: Aws::S3::Client.new(stub_responses: true),
    }

    allow(AwsClient).to receive(:[]) { |client|
      @mock_aws_clients[client]
    }
  end

  context "#parse_pathogen_list_csv" do
    subject { PathogenList.parse_pathogen_list_csv("test_bucket", "test_filepath") }

    it "should raise an error if required headers are missing" do
      missing_header_csv = CSV.generate do |csv|
        csv << ["Species", "taxID", "Source"]
        csv << ["species_a", "1", "test_source"]
      end
      pathogens = CSV.parse(missing_header_csv, headers: true)
      allow(CSV).to receive(:parse).and_return(pathogens)

      expect { subject }.to raise_error(PathogenListHelper::UPDATE_PROCESS_FAILED)
    end

    it "should return the correct pathogens if required headers present" do
      test_csv = CSV.generate do |csv|
        csv << ["Species", "taxID", "Source", "Footnote"]
        csv << ["species_a", "1", "test_source", "test_footnote"]
      end

      pathogens = CSV.parse(test_csv, headers: true)
      allow(CSV).to receive(:parse).and_return(pathogens)

      result = subject
      expect(result).to eq(pathogens.map(&:to_h))
    end
  end
end
