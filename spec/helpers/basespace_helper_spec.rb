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
                "Id" => "1",
              },
              {
                "Name" => file_two_name,
                "HrefContent" => file_two_href_content,
                "Href" => file_two_href,
                "Id" => "2",
              },
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
              source_path: file_one_href,
            },
            {
              name: file_two_name,
              download_path: file_two_href_content,
              source_path: file_two_href,
            },
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
        expect(LogUtil).to receive(:log_err).with("Fetch files for Basespace dataset failed with error: Failed to get files").exactly(1).times
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
      it "returns true" do
        expect(Syscall).to receive(:pipe).with(
          ["curl", "--fail", "-s", "--show-error", fake_basespace_path],
          ["aws", "s3", "cp", "-", "#{fake_s3_path}/#{fake_file_name}"]
        ).exactly(1).times.and_return([
                                        true, "",
                                      ])
        expect(LogUtil).to receive(:log_err).exactly(0).times

        success = helper.upload_from_basespace_to_s3(fake_basespace_path, fake_s3_path, fake_file_name)
        expect(success).to be true
      end
    end

    context "upload fails" do
      let(:fake_std_err) { "curl: (22) The requested URL returned error: 403 Forbidden" }

      it "returns true" do
        expect(Syscall).to receive(:pipe).with(
          ["curl", "--fail", "-s", "--show-error", fake_basespace_path],
          ["aws", "s3", "cp", "-", "#{fake_s3_path}/#{fake_file_name}"]
        ).exactly(1).times.and_return([
                                        false, fake_std_err,
                                      ])

        # If the syscall fails, we should log the error.
        expect(LogUtil).to receive(:log_err).with(
          "Failed to transfer file from basespace to #{fake_s3_path} for #{fake_file_name}: #{fake_std_err}"
        ).exactly(1).times

        success = helper.upload_from_basespace_to_s3(fake_basespace_path, fake_s3_path, fake_file_name)
        expect(success).to be false
      end
    end

    describe "#revoke_access_token" do
      let(:fake_access_token) { "fake_access_token" }

      it "should call DELETE basespace endpoint" do
        expect(HttpHelper).to receive(:delete).with(anything, "x-access-token" => fake_access_token).exactly(1).times

        BasespaceHelper.revoke_access_token(fake_access_token)
      end
    end

    describe "#verify_access_token_revoked" do
      let(:fake_access_token) { "fake_access_token" }

      it "should call Basespace API to test access token" do
        expect(HttpHelper).to receive(:get_json).with(anything, anything, { "Authorization" => "Bearer #{fake_access_token}" }, anything)
                                                .exactly(1).times.and_raise(HttpHelper::HttpError.new("HTTP Get request failed", 401))
        expect(LogUtil).to receive(:log_err).with("BasespaceAccessTokenError: Failed to revoke access token for sample id 123abc")
                                            .exactly(0).times
        expect(Rails.logger).to receive(:info).with("Revoke access token check succeeded").exactly(1).times

        BasespaceHelper.verify_access_token_revoked(fake_access_token, "123abc")
      end

      it "should log an error if Basespace API call unexpectedly succeeds" do
        expect(HttpHelper).to receive(:get_json).with(anything, anything, { "Authorization" => "Bearer #{fake_access_token}" }, anything)
                                                .exactly(1).times.and_return("foo" => "bar")
        expect(LogUtil).to receive(:log_err).with("BasespaceAccessTokenError: Failed to revoke access token for sample id 123abc")
                                            .exactly(1).times
        expect(Rails.logger).to receive(:info).with("Revoke access token check succeeded").exactly(0).times

        BasespaceHelper.verify_access_token_revoked(fake_access_token, "123abc")
      end
    end
  end
end
