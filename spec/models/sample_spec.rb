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
                                                                                                 source_path: file_one_href # This is the same as the previous
                                                                                               },
                                                                                             ])

        expect(@sample).to receive(:upload_from_basespace_to_s3).exactly(2).times.and_return(2)
        expect(@sample).to receive(:kickoff_pipeline).exactly(0).times
        # Check that the proper error message is logged.
        expect(LogUtil).to receive(:log_err_and_airbrake).with(
          "SampleUploadFailedEvent: Validation failed: Input files have identical read 1 source and read 2 source"
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
        expect(LogUtil).to receive(:log_err_and_airbrake).with(
          "SampleUploadFailedEvent: Validation failed: Input files invalid number (3)"
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
        expect(LogUtil).to receive(:log_err_and_airbrake).with(
          "SampleUploadFailedEvent: #{ErrorHelper::SampleUploadErrors.error_fetching_basespace_files_for_dataset(fake_dataset_id, @sample.name, @sample.id)}"
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
        expect(LogUtil).to receive(:log_err_and_airbrake).with(
          "SampleUploadFailedEvent: #{ErrorHelper::SampleUploadErrors.no_files_in_basespace_dataset(fake_dataset_id, @sample.name, @sample.id)}"
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
        expect(LogUtil).to receive(:log_err_and_airbrake).with(
          "SampleUploadFailedEvent: #{ErrorHelper::SampleUploadErrors.upload_from_basespace_failed(@sample.name, @sample.id, file_one_name, fake_dataset_id, 3)}"
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

  context "Consensus Genomes pipeline" do
    let(:fake_sfn_name) { "fake_sfn_name" }
    let(:fake_sfn_arn) { "fake:sfn:arn".freeze }
    let(:fake_sfn_execution_arn) { "fake:sfn:execution:arn:#{fake_sfn_name}".freeze }
    let(:fake_sfn_execution_description) do
      {
        execution_arn: fake_sfn_execution_arn,
        input: "{}",
        # AWS SDK rounds to second
        start_date: Time.zone.now.round,
        state_machine_arn: fake_sfn_arn,
        status: "SUCCESS",
      }
    end
    let(:fake_dispatch_response) do
      {
        sfn_input_json: {},
        sfn_execution_arn: fake_sfn_execution_arn,
      }
    end

    before do
      project = create(:project)
      @sample = create(:sample, project: project, temp_pipeline_workflow: Sample::CONSENSUS_GENOME_PIPELINE_WORKFLOW, temp_sfn_execution_arn: fake_sfn_execution_arn, temp_wetlab_protocol: Sample::TEMP_WETLAB_PROTOCOL[:artic])
      @sample_running = create(:sample, project: project, temp_pipeline_workflow: Sample::CONSENSUS_GENOME_PIPELINE_WORKFLOW, temp_sfn_execution_status: Sample::SFN_STATUS[:running], temp_sfn_execution_arn: fake_sfn_execution_arn)

      @mock_aws_clients = {
        s3: Aws::S3::Client.new(stub_responses: true),
        states: Aws::States::Client.new(stub_responses: true),
      }
      allow(AwsClient).to receive(:[]) { |client|
        @mock_aws_clients[client]
      }

      AppConfigHelper.set_app_config(AppConfig::SFN_CG_ARN, fake_sfn_arn)
    end

    context "#temp_workflows_in_progress" do
      it "loads CG pipelines in progress" do
        res = Sample.temp_workflows_in_progress(Sample::CONSENSUS_GENOME_PIPELINE_WORKFLOW)
        expect(res).to eq([@sample_running])
      end
    end

    context "#temp_update_workflow_status" do
      it "checks and updates CG pipeline statuses" do
        @mock_aws_clients[:states].stub_responses(:describe_execution, fake_sfn_execution_description)

        @sample_running.temp_update_workflow_status
        expect(@sample_running).to have_attributes(temp_sfn_execution_status: fake_sfn_execution_description[:status])
      end

      it "reports errors in checking CG pipeline statuses" do
        allow(@mock_aws_clients[:states]).to receive(:describe_execution).and_raise(StandardError)
        expect(LogUtil).to receive(:log_err_and_airbrake)

        @sample_running.temp_update_workflow_status
      end
    end

    context "#temp_sfn_description" do
      context "when arn exists" do
        it "returns description" do
          @mock_aws_clients[:states].stub_responses(:describe_execution, lambda { |context|
            context.params[:execution_arn] == fake_sfn_execution_arn ? fake_sfn_execution_description : 'ExecutionDoesNotExist'
          })

          expect(@sample.temp_sfn_description).to have_attributes(fake_sfn_execution_description)
        end
      end

      context "when arn does not exist" do
        it "returns description from s3" do
          @mock_aws_clients[:states].stub_responses(:describe_execution, 'ExecutionDoesNotExist')
          fake_s3_path = File.join(@sample.sample_output_s3_path.split("/", 4)[-1], "sfn-desc", fake_sfn_execution_arn)
          fake_bucket = { fake_s3_path => { body: JSON.dump(fake_sfn_execution_description) } }
          @mock_aws_clients[:s3].stub_responses(:get_object, lambda { |context|
            fake_bucket[context.params[:key]] || 'NoSuchKey'
          })

          # ATTENTION: if loading a JSON from S3 json time fields will come as strings
          expected_description = fake_sfn_execution_description.merge(
            start_date: fake_sfn_execution_description[:start_date].to_s
          )
          expect(@sample.temp_sfn_description).to eq(expected_description)
        end
      end
    end
  end
end
