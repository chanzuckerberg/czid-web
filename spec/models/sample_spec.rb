require 'rails_helper'

describe Sample, type: :model do
  let(:file_one_name) { "sample_one.fastq.gz" }
  let(:file_one_href_content) { "https://basespace.amazonaws.com/abc123/sample_one.fastq.gz" }
  let(:file_one_href) { "https://api.basespace.illumina.com/v2/files/1" }

  let(:file_two_name) { "sample_two.fastq.gz" }
  let(:file_two_href_content) { "https://basespace.amazonaws.com/abc123/sample_two.fastq.gz" }
  let(:file_two_href) { "https://api.basespace.illumina.com/v2/files/2" }

  let(:file_three_name) { "sample_three.fastq.gz" }
  let(:file_three_href_content) { "https://basespace.amazonaws.com/abc123/sample_three.fastq.gz" }
  let(:file_three_href) { "https://api.basespace.illumina.com/v2/files/3" }

  let(:fake_dataset_id) { "fake_dataset_id" }
  let(:fake_access_token) { "fake_access_token" }

  let(:fake_files_for_basespace_dataset_response) do
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
  end

  context "#transfer_basespace_files" do
    before do
      project = create(:public_project)
      create(:alignment_config, name: AlignmentConfig::DEFAULT_NAME)
      @sample = create(:sample, project: project, status: Sample::STATUS_CREATED, input_files: [], uploaded_from_basespace: 1)
    end

    context "fetches file metadata and downloads files successfully" do
      it "updates the sample as expected and kicks off the pipeline" do
        # Set up mocks.
        expect(@sample).to receive(:files_for_basespace_dataset).exactly(1).times.and_return(fake_files_for_basespace_dataset_response)
        expect(@sample).to receive(:upload_from_basespace_to_s3).exactly(2).times.and_return(true)
        expect(@sample).to receive(:kickoff_pipeline).exactly(1).times

        @sample.transfer_basespace_files(fake_dataset_id, fake_access_token)

        expect(@sample.status).to eq(Sample::STATUS_CHECKED)
        expect(@sample.upload_error).to eq(nil)
        expect(@sample.input_files.length).to be 2

        expect(@sample.input_files[0].name).to eq(file_one_name)
        expect(@sample.input_files[0].source_type).to eq(InputFile::SOURCE_TYPE_BASESPACE)
        expect(@sample.input_files[0].source).to eq(file_one_href)
        expect(@sample.input_files[1].name).to eq(file_two_name)
        expect(@sample.input_files[1].source_type).to eq(InputFile::SOURCE_TYPE_BASESPACE)
        expect(@sample.input_files[1].source).to eq(file_two_href)
      end

      it "updates the sample as expected and kicks off the pipeline with only one input file" do
        # Set up mocks.
        expect(@sample).to receive(:files_for_basespace_dataset).exactly(1).times.and_return([
                                                                                               {
                                                                                                 name: file_one_name,
                                                                                                 download_path: file_one_href_content,
                                                                                                 source_path: file_one_href,
                                                                                               },
                                                                                             ])
        expect(@sample).to receive(:upload_from_basespace_to_s3).exactly(1).times.and_return(true)
        expect(@sample).to receive(:kickoff_pipeline).exactly(1).times

        @sample.transfer_basespace_files(fake_dataset_id, fake_access_token)

        expect(@sample.status).to eq(Sample::STATUS_CHECKED)
        expect(@sample.upload_error).to eq(nil)
        expect(@sample.input_files.length).to be 1

        expect(@sample.input_files[0].name).to eq(file_one_name)
        expect(@sample.input_files[0].source_type).to eq(InputFile::SOURCE_TYPE_BASESPACE)
        expect(@sample.input_files[0].source).to eq(file_one_href)
      end

      it "does nothing if sample.status != STATUS_CREATED" do
        # Set up mocks.
        expect(@sample).to receive(:files_for_basespace_dataset).exactly(0).times
        expect(@sample).to receive(:upload_from_basespace_to_s3).exactly(0).times
        expect(@sample).to receive(:kickoff_pipeline).exactly(0).times

        @sample.status = Sample::STATUS_UPLOADED

        @sample.transfer_basespace_files(fake_dataset_id, fake_access_token)

        expect(@sample.status).to eq(Sample::STATUS_UPLOADED)
        expect(@sample.upload_error).to eq(nil)
        expect(@sample.input_files.length).to be 0
      end

      it "runs the input file checks and fails if the two basespace files have the same source" do
        expect(@sample).to receive(:files_for_basespace_dataset).exactly(1).times.and_return([
                                                                                               {
                                                                                                 name: file_one_name,
                                                                                                 download_path: file_one_href_content,
                                                                                                 source_path: file_one_href,
                                                                                               },
                                                                                               {
                                                                                                 name: file_two_name,
                                                                                                 download_path: file_two_href_content,
                                                                                                 source_path: file_one_href, # This is the same as the previous
                                                                                               },
                                                                                             ])

        expect(@sample).to receive(:upload_from_basespace_to_s3).exactly(2).times.and_return(2)
        expect(@sample).to receive(:kickoff_pipeline).exactly(0).times
        # Check that the proper error message is logged.
        expect(LogUtil).to receive(:log_error).with(
          "SampleUploadFailedEvent: Validation failed: Input files have identical read 1 source and read 2 source",
          hash_including(basespace_access_token: "fake_access_token", basespace_dataset_id: "fake_dataset_id")
        ).exactly(1).times

        @sample.transfer_basespace_files(fake_dataset_id, fake_access_token)

        expect(@sample.status).to eq(Sample::STATUS_CHECKED)
        expect(@sample.upload_error).to eq(Sample::UPLOAD_ERROR_BASESPACE_UPLOAD_FAILED)
        expect(@sample.input_files.length).to be 0
      end

      it "runs the input file checks and fails if Basespace returns more than two input files" do
        expect(@sample).to receive(:files_for_basespace_dataset).exactly(1).times.and_return([
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
                                                                                               {
                                                                                                 name: file_three_name,
                                                                                                 download_path: file_three_href_content,
                                                                                                 source_path: file_three_href,
                                                                                               },
                                                                                             ])

        expect(@sample).to receive(:upload_from_basespace_to_s3).exactly(3).times.and_return(2)
        expect(@sample).to receive(:kickoff_pipeline).exactly(0).times
        # Check that the proper error message is logged.
        expect(LogUtil).to receive(:log_error).with(
          "SampleUploadFailedEvent: Validation failed: Input files invalid number (3)",
          hash_including(basespace_access_token: "fake_access_token", basespace_dataset_id: "fake_dataset_id")
        ).exactly(1).times

        @sample.transfer_basespace_files(fake_dataset_id, fake_access_token)

        expect(@sample.status).to eq(Sample::STATUS_CHECKED)
        expect(@sample.upload_error).to eq(Sample::UPLOAD_ERROR_BASESPACE_UPLOAD_FAILED)
        expect(@sample.input_files.length).to be 0
      end
    end

    context "cannot fetch file metadata for basespace dataset" do
      it "fails gracefully and adds a failed pipeline run" do
        # Set up mocks.
        expect(@sample).to receive(:files_for_basespace_dataset).exactly(1).times.and_return(nil)
        expect(@sample).to receive(:upload_from_basespace_to_s3).exactly(0).times
        expect(@sample).to receive(:kickoff_pipeline).exactly(0).times
        # Check that the proper error message is logged.
        expect(LogUtil).to receive(:log_error).with(
          "SampleUploadFailedEvent: #{ErrorHelper::SampleUploadErrors.error_fetching_basespace_files_for_dataset(fake_dataset_id, @sample.name, @sample.id)}",
          hash_including(basespace_access_token: "fake_access_token", basespace_dataset_id: "fake_dataset_id")
        ).exactly(1).times

        @sample.transfer_basespace_files(fake_dataset_id, fake_access_token)

        expect(@sample.status).to eq(Sample::STATUS_CHECKED)
        expect(@sample.upload_error).to eq(Sample::UPLOAD_ERROR_BASESPACE_UPLOAD_FAILED)
        expect(@sample.input_files.length).to be 0
      end
    end

    context "fetched zero files for basespace dataset" do
      it "fails gracefully and adds a failed pipeline run" do
        # Set up mocks.
        expect(@sample).to receive(:files_for_basespace_dataset).exactly(1).times.and_return([])
        expect(@sample).to receive(:upload_from_basespace_to_s3).exactly(0).times
        expect(@sample).to receive(:kickoff_pipeline).exactly(0).times
        # Check that the proper error message is logged.
        expect(LogUtil).to receive(:log_error).with(
          "SampleUploadFailedEvent: #{ErrorHelper::SampleUploadErrors.no_files_in_basespace_dataset(fake_dataset_id, @sample.name, @sample.id)}",
          hash_including(basespace_access_token: "fake_access_token", basespace_dataset_id: "fake_dataset_id")
        ).exactly(1).times

        @sample.transfer_basespace_files(fake_dataset_id, fake_access_token)

        expect(@sample.status).to eq(Sample::STATUS_CHECKED)
        expect(@sample.upload_error).to eq(Sample::UPLOAD_ERROR_BASESPACE_UPLOAD_FAILED)
        expect(@sample.input_files.length).to be 0
      end
    end

    context "cannot download basespace files" do
      it "fails gracefully and adds a failed pipeline run" do
        # Set up mocks.
        expect(@sample).to receive(:files_for_basespace_dataset).exactly(1).times.and_return(fake_files_for_basespace_dataset_response)
        expect(@sample).to receive(:upload_from_basespace_to_s3).exactly(3).times.and_return(false)
        expect(@sample).to receive(:kickoff_pipeline).exactly(0).times
        # Expect to sleep 60 after first failure, then sleep 300 on second failure.
        expect(Kernel).to receive(:sleep).with(60).ordered
        expect(Kernel).to receive(:sleep).with(300).ordered
        # Check that the proper error message is logged.
        expect(LogUtil).to receive(:log_error).with(
          "SampleUploadFailedEvent: #{ErrorHelper::SampleUploadErrors.upload_from_basespace_failed(@sample.name, @sample.id, file_one_name, fake_dataset_id, 3)}",
          hash_including(basespace_access_token: "fake_access_token", basespace_dataset_id: "fake_dataset_id")
        ).exactly(1).times

        @sample.transfer_basespace_files(fake_dataset_id, fake_access_token)

        expect(@sample.status).to eq(Sample::STATUS_CHECKED)
        expect(@sample.upload_error).to eq(Sample::UPLOAD_ERROR_BASESPACE_UPLOAD_FAILED)
        expect(@sample.input_files.length).to be 0
      end
    end
  end

  context "#status_url" do
    before do
      project = create(:public_project)
      @sample = create(:sample, project: project)
    end

    it "returns the url to the sample status page" do
      skip "The actual URL depends on the execution environment"
      expect(@sample.status_url).to eq("http://localhost:3000/samples/8/pipeline_runs")
    end
  end

  context "#search_by_name" do
    before do
      project = create(:project, name: "Test Search Project")
      @sample_single_match1 = create(:sample, project: project, name: "Sample test single match 1")
      @sample_single_match2 = create(:sample, project: project, name: "Sample test single match 2")
      @sample_partial_match = create(:sample, project: project, name: "Sample test anywhereSinglePartial match")
      @sample_multiple_match = create(:sample, project: project, name: "Sample test single and multiple match")
      @sample_no_match = create(:sample, project: project, name: "Sample test with no match")
    end

    subject { Sample.search_by_name(query) }

    context "with a single word query" do
      let(:query) { "single" }

      it "returns samples matching single word query" do
        expect(subject.pluck(:name)).to include(@sample_single_match1.name, @sample_single_match2.name, @sample_multiple_match.name)
      end

      it "returns samples with partial matches" do
        expect(subject.pluck(:name)).to include(@sample_partial_match.name)
      end

      it "does not return samples with no matches" do
        expect(subject.pluck(:name)).to_not include(@sample_no_match.name)
      end
    end

    context "with a multiple word query" do
      let(:query) { "single multiple" }

      it "returns only samples matching all tokens in query" do
        expect(subject.pluck(:name)).to eq([@sample_multiple_match.name])
      end
    end
  end

  context "#first_workflow_run" do
    before do
      project = create(:public_project)
      @sample = create(:sample, project: project)
      @workflow_run = create(:workflow_run, sample: @sample, workflow: WorkflowRun::WORKFLOW[:consensus_genome], executed_at: Time.now.utc)
      @second_workflow_run = create(:workflow_run, sample: @sample, workflow: WorkflowRun::WORKFLOW[:consensus_genome], executed_at: 1.day.ago)

      @second_sample = create(:sample, project: project)
      @deprecated_workflow_run = create(:workflow_run, sample: @second_sample, workflow: WorkflowRun::WORKFLOW[:consensus_genome], deprecated: true)
    end

    subject { @sample.first_workflow_run(WorkflowRun::WORKFLOW[:consensus_genome]) }

    it "returns the correct top workflow run" do
      expect(subject).to eq(@workflow_run)
    end

    it "does not return deprecated workflow runs" do
      result = @second_sample.first_workflow_run(WorkflowRun::WORKFLOW[:consensus_genome])
      expect(result).to eq(nil)
    end

    it "returns only the workflow runs with the workflow name" do
      result = @sample.first_workflow_run("fake_workflow_name")
      expect(result).to eq(nil)
    end
  end

  context "#sort_samples" do
    before do
      project_one = create(:project)
      @project_two = create(:project)

      # Note: samples two and three are created out of order for testing purposes
      # Test samples are created where:
      #   - @sample_one contains a low-value sortable data
      #   - @sample_two and @sample_three contain the same high-value sortable data (for tiebreaker testing)
      #   - sample_four (optional) contains null sortable data
      # such that sample_four < @sample_one < @sample_three < @sample_two.
      @sample_one = create(:sample, project: project_one, name: "Test Sample A", created_at: 3.days.ago,
                                    metadata_fields: { collection_location_v2: "Los Angeles, USA", sample_type: "CSF", water_control: "No" })
      @sample_three = create(:sample, project: project_one, name: "Test Sample B", created_at: 2.days.ago,
                                      metadata_fields: { collection_location_v2: "San Francisco, USA", sample_type: "Serum", water_control: "Yes" })
      @sample_two = create(:sample, project: @project_two, name: "Test Sample B", created_at: 1.day.ago,
                                    metadata_fields: { collection_location_v2: "San Francisco, USA", sample_type: "Serum", water_control: "Yes" })
      @samples_input = Sample.where(id: [@sample_one.id, @sample_two.id, @sample_three.id])
    end

    it "returns unsorted samples for invalid/unsortable data keys" do
      asc_results = Sample.sort_samples(@samples_input, "invalid_data_key", "asc")
      expect(asc_results.pluck(:id)).to eq(@samples_input.pluck(:id))

      desc_results = Sample.sort_samples(@samples_input, "invalid_data_key", "desc")
      expect(desc_results.pluck(:id)).to eq(@samples_input.pluck(:id))
    end

    it "correctly sorts samples by samples fields" do
      ["sample", "createdAt"].each do |samples_sort_key|
        asc_results = Sample.sort_samples(@samples_input, samples_sort_key, "asc")
        expect(asc_results.pluck(:id)).to eq([@sample_one.id, @sample_three.id, @sample_two.id])

        desc_results = Sample.sort_samples(@samples_input, samples_sort_key, "desc")
        expect(desc_results.pluck(:id)).to eq([@sample_two.id, @sample_three.id, @sample_one.id])
      end
    end

    it "correctly sorts samples by metadata fields" do
      # create sample with no metadata to test null-handling
      sample_four = create(:sample, project: @project_two, name: "Test Sample C", created_at: 1.day.ago)

      samples = Sample.where(id: [@sample_one.id, @sample_two.id, @sample_three.id, sample_four.id])

      ["sampleType", "waterControl"].each do |metadata_sort_key|
        asc_results = Sample.sort_samples(samples, metadata_sort_key, "asc")
        expect(asc_results.pluck(:id)).to eq([sample_four.id, @sample_one.id, @sample_three.id, @sample_two.id])

        desc_results = Sample.sort_samples(samples, metadata_sort_key, "desc")
        expect(desc_results.pluck(:id)).to eq([@sample_two.id, @sample_three.id, @sample_one.id, sample_four.id])
      end
    end

    it "correctly sorts samples by location" do
      # Ensures that location metadata field is valid for sample_four
      location_metadata_field = create(
        :metadata_field, name: 'collection_location_v2', base_type: MetadataField::LOCATION_TYPE
      )
      host_genome = create(:host_genome, name: "mock_host_genome")
      host_genome.metadata_fields << location_metadata_field
      sample_four = create(:sample, project: @project_two, name: "Test Sample C", created_at: 1.day.ago, host_genome: host_genome)

      # Create sample_four with a lowest-value location name
      # and which stores location info in a location object (vs in its metadata's string_validated_value)
      location = create(:location, name: "California, USA", osm_id: 200, locationiq_id: 100)
      location_metadata = Metadatum.new(
        sample: sample_four,
        metadata_field: location_metadata_field,
        key: "collection_location_v2",
        location: location
      )
      location_metadata.save!

      samples = Sample.where(id: [@sample_one.id, @sample_two.id, @sample_three.id, sample_four.id])

      asc_results = Sample.sort_samples(samples, "collectionLocationV2", "asc")
      expect(asc_results.pluck(:id)).to eq([sample_four.id, @sample_one.id, @sample_three.id, @sample_two.id])

      desc_results = Sample.sort_samples(samples, "collectionLocationV2", "desc")
      expect(desc_results.pluck(:id)).to eq([@sample_two.id, @sample_three.id, @sample_one.id, sample_four.id])
    end

    it "correctly sorts samples by host genome" do
      human_hg = create(:host_genome, name: "Human")
      mosquito_hg = create(:host_genome, name: "Mosquito")

      @sample_one.update(host_genome_id: human_hg.id)
      @sample_three.update(host_genome_id: mosquito_hg.id)
      @sample_two.update(host_genome_id: mosquito_hg.id)

      asc_results = Sample.sort_samples(@samples_input, "host", "asc")
      expect(asc_results.pluck(:id)).to eq([@sample_one.id, @sample_three.id, @sample_two.id])

      desc_results = Sample.sort_samples(@samples_input, "host", "desc")
      expect(desc_results.pluck(:id)).to eq([@sample_two.id, @sample_three.id, @sample_one.id])
    end
  end
end
