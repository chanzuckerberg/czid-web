require "rails_helper"
require "webmock/rspec"

RSpec.describe SamplesHelper, type: :helper do
  describe "#upload_samples_with_metadata" do
    context "with basespace samples" do
      let(:fake_access_token) { "fake_access_token" }
      let(:fake_dataset_id) { "fake_dataset_id" }
      let(:fake_sample_name) { "fake_sample_name" }

      before do
        @project = create(:public_project)
        @joe = create(:joe)
        @host_genome = create(:host_genome)
      end

      let(:basespace_sample_attributes) do
        [
          {
            basespace_access_token: fake_access_token,
            basespace_dataset_id: fake_dataset_id,
            host_genome_id: @host_genome.id,
            name: fake_sample_name,
            project_id: @project.id
          }
        ]
      end

      let(:metadata_attributes) do
        {
          fake_sample_name.to_s => {
            "Sample Type" => "CSF",
            "Nucleotide Type" => "DNA",
            "Collection Location" => "CA, USA",
            "Collection Date" => "2010-01"
          }
        }
      end

      it "saved successfully" do
        # Set up mocks
        expect(Resque).to receive(:enqueue).with(
          TransferBasespaceFiles, anything, fake_dataset_id, fake_access_token
        ).exactly(1).times

        response = helper.upload_samples_with_metadata(
          basespace_sample_attributes,
          metadata_attributes,
          @joe
        )

        expect(response["samples"].length).to be 1
        expect(response["errors"].length).to be 0

        created_sample = response["samples"][0]

        expect(created_sample.name).to eq(fake_sample_name)
        expect(created_sample.host_genome.id).to be @host_genome.id
        expect(created_sample.project.id).to be @project.id
        expect(created_sample.bulk_mode).to be nil
        expect(created_sample.uploaded_from_basespace).to be 1
        expect(created_sample.user).to eq(@joe)

        expect(Metadatum.where(sample_id: created_sample.id).length).to be 4
        expect(Metadatum.where(sample_id: created_sample.id, key: "Sample Type").length).to be 1
        expect(Metadatum.where(sample_id: created_sample.id, key: "Sample Type")[0].raw_value).to eq("CSF")
        expect(Metadatum.where(sample_id: created_sample.id, key: "Nucleotide Type").length).to be 1
        expect(Metadatum.where(sample_id: created_sample.id, key: "Nucleotide Type")[0].raw_value).to eq("DNA")
        expect(Metadatum.where(sample_id: created_sample.id, key: "Collection Location").length).to be 1
        expect(Metadatum.where(sample_id: created_sample.id, key: "Collection Location")[0].raw_value).to eq("CA, USA")
        expect(Metadatum.where(sample_id: created_sample.id, key: "Collection Date").length).to be 1
        expect(Metadatum.where(sample_id: created_sample.id, key: "Collection Date")[0].raw_value).to eq("2010-01")
      end

      it "fails if basespace_access_token is not provided" do
        response = helper.upload_samples_with_metadata(
          basespace_sample_attributes.map { |sample| sample.reject { |key, _| key == :basespace_access_token } },
          metadata_attributes,
          @joe
        )

        expect(response["samples"].length).to be 0
        expect(response["errors"]).to eq([
                                           ErrorHelper::SampleUploadErrors.missing_input_files_or_basespace_params(fake_sample_name)
                                         ])
      end

      it "fails if basespace_dataset_id is not provided" do
        response = helper.upload_samples_with_metadata(
          basespace_sample_attributes.map { |sample| sample.reject { |key, _| key == :basespace_dataset_id } },
          metadata_attributes,
          @joe
        )

        expect(response["samples"].length).to be 0
        expect(response["errors"]).to eq([
                                           ErrorHelper::SampleUploadErrors.missing_input_files_or_basespace_params(fake_sample_name)
                                         ])
      end
    end
  end
end
