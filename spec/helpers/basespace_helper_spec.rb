require "rails_helper"
require "webmock/rspec"

RSpec.describe BasespaceHelper, type: :helper do
  describe "#files_for_basespace_dataset" do
    let(:file_one_name) { "sample_one.fastq.gz" }
    let(:file_one_href_content) { "https://basespace.amazonaws.com/abc123/sample_one.fastq.gz" }
    let(:file_one_href) { "https://api.basespace.illumina.com/v2/files/1" }

    let(:file_two_name) { "sample_two.fastq.gz" }
    let(:file_two_href_content) { "https://basespace.amazonaws.com/abc123/sample_two.fastq.gz" }
    let(:file_two_href) { "https://api.basespace.illumina.com/v2/files/2" }

    let(:fake_dataset_id) { "abc123real" }
    let(:fake_access_token) { "token" }

    context "basespace API call returns successfully" do
      before do
        allow(HttpHelper).to receive(:get_json)
          .and_return(
            "Items" => [
              {
                "Name" => file_one_name,
                "HrefContent" => file_one_href_content,
                "Href" => file_one_href,
                "Id" => "1"
              },
              {
                "Name" => file_two_name,
                "HrefContent" => file_two_href_content,
                "Href" => file_two_href,
                "Id" => "2"
              }
            ]
          )
      end

      it "returns selected fields of files" do
        files = helper.files_for_basespace_dataset(fake_dataset_id, fake_access_token)

        expect(files).to eq(
          [
            {
              name: file_one_name,
              download_path: file_one_href_content,
              source_path: file_one_href
            },
            {
              name: file_two_name,
              download_path: file_two_href_content,
              source_path: file_two_href
            }
          ]
        )
      end
    end

    context "basespace API returns zero samples" do
      before do
        allow(HttpHelper).to receive(:get_json)
          .and_return("Items" => [])
      end

      it "returns zero samples" do
        files = helper.files_for_basespace_dataset(fake_dataset_id, fake_access_token)

        expect(files).to eq([])
      end
    end

    context "basespace API call fails" do
      before do
        allow(HttpHelper).to receive(:get_json)
          .and_return("ErrorMessage" => "Failed to get files")
      end

      it "returns nil" do
        expect(LogUtil).to receive(:log_err_and_airbrake).with("files_for_basespace_dataset failed with error: Failed to get files").exactly(1).times
        files = helper.files_for_basespace_dataset(fake_dataset_id, fake_access_token)

        expect(files).to eq(nil)
      end
    end
  end

  describe "#upload_from_basespace_to_s3" do
    let(:fake_basespace_path) { "fake_basespace_path" }
    let(:fake_s3_path) { "fake_s3_path" }
    let(:fake_file_name) { "fake_file_name" }

    context "upload happens successfully" do
      before do
        expect(helper).to receive(:open).with(fake_basespace_path).exactly(1).times
        expect(IO).to receive(:copy_stream).exactly(1).times
        expect(Syscall).to receive(:s3_cp).with(anything, "#{fake_s3_path}/#{fake_file_name}").exactly(1).times.and_return(true)
      end

      it "returns true" do
        response = helper.upload_from_basespace_to_s3(fake_basespace_path, fake_s3_path, fake_file_name)
        expect(response).to be true
      end
    end
  end
end
