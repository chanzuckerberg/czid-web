require "rails_helper"

describe WorkflowRun, type: :model do
  let(:fake_sfn_name) { "fake_sfn_name" }
  let(:fake_sfn_arn) { "fake:sfn:arn".freeze }
  let(:fake_sfn_execution_arn) { "fake:sfn:execution:arn:#{fake_sfn_name}".freeze }
  let(:fake_sfn_status) { "SUCCEEDED" }
  let(:fake_sfn_execution_description) do
    {
      execution_arn: fake_sfn_execution_arn,
      input: "{}",
      # AWS SDK rounds to second
      start_date: Time.zone.now.round,
      state_machine_arn: fake_sfn_arn,
      status: fake_sfn_status,
    }
  end

  let(:failed_sfn_status) { "FAILED" }
  let(:failed_sfn_error) { "sfn error" }
  let(:failed_sfn_error_message) { "sfn error message" }
  let(:failed_sfn_error_message_json) { { message: failed_sfn_error_message }.to_json }
  let(:failed_sfn_error_cause) { { errorMessage: failed_sfn_error_message_json }.to_json }
  let(:fake_failed_sfn_execution_description) do
    {
      execution_arn: fake_sfn_execution_arn,
      input: "{}",
      # AWS SDK rounds to second
      start_date: Time.zone.now.round,
      state_machine_arn: fake_sfn_arn,
      status: failed_sfn_status,
    }
  end
  let(:fake_error_sfn_execution_history) do
    {
      events: [
        {
          id: 1,
          execution_failed_event_details: {
            error: failed_sfn_error,
            cause: failed_sfn_error_cause,
          },
          timestamp: Time.zone.now,
          type: "dummy_type",
        },
      ],
    }
  end

  let(:bad_input_error_message) { "input error message" }
  let(:bad_input_sfn_error_cause) { { errorMessage: bad_input_error_message }.to_json }
  let(:fake_bad_input_sfn_execution_history) do
    {
      events: [
        {
          id: 1,
          execution_failed_event_details: {
            error: "InsufficientReadsError",
            cause: bad_input_sfn_error_cause,
          },
          timestamp: Time.zone.now,
          type: "dummy_type",
        },
      ],
    }
  end
  let(:fake_dispatch_response) do
    {
      sfn_input_json: {},
      sfn_execution_arn: fake_sfn_execution_arn,
    }
  end
  let(:fake_runtime) { 10.minutes }

  before do
    project = create(:project)
    @sample = create(:sample, project: project)
    inputs_json = { wetlab_protocol: ConsensusGenomeWorkflowRun::WETLAB_PROTOCOL[:artic] }.to_json
    @workflow_running = create(:workflow_run, workflow: WorkflowRun::WORKFLOW[:consensus_genome], status: WorkflowRun::STATUS[:running], sample: @sample, sfn_execution_arn: fake_sfn_execution_arn, inputs_json: inputs_json, executed_at: fake_runtime.ago)

    @second_sample = create(:sample, project: project)
    @second_workflow_running = create(:workflow_run, workflow: WorkflowRun::WORKFLOW[:consensus_genome], status: WorkflowRun::STATUS[:running], sample: @second_sample, sfn_execution_arn: fake_sfn_execution_arn, inputs_json: inputs_json, executed_at: fake_runtime.ago)

    @workflow_failed = create(:workflow_run, workflow: WorkflowRun::WORKFLOW[:consensus_genome], status: WorkflowRun::STATUS[:failed], sample: @sample, sfn_execution_arn: fake_sfn_execution_arn)

    @mock_aws_clients = {
      s3: Aws::S3::Client.new(stub_responses: true),
      states: Aws::States::Client.new(stub_responses: true),
    }
    allow(AwsClient).to receive(:[]) { |client|
      @mock_aws_clients[client]
    }

    AppConfigHelper.set_app_config(AppConfig::SFN_SINGLE_WDL_ARN, fake_sfn_arn)
  end

  describe "#in_progress" do
    it "loads Consensus Genome workflows in progress" do
      res = WorkflowRun.in_progress(WorkflowRun::WORKFLOW[:consensus_genome])
      expect(res).to eq([@workflow_running, @second_workflow_running])
    end

    it "loads all workflow runs in progress" do
      expect(WorkflowRun.in_progress).to eq([@workflow_running, @second_workflow_running])
    end
  end

  describe "#update_status" do
    it "checks and updates run statuses" do
      @mock_aws_clients[:states].stub_responses(:describe_execution, fake_sfn_execution_description)

      @workflow_running.update_status
      expect(@workflow_running).to have_attributes(status: fake_sfn_execution_description[:status])
    end

    it "accepts a run status as an argument" do
      new_status = "FAILED"

      @workflow_running.update_status(new_status)
      expect(@workflow_running).to have_attributes(status: new_status)
    end

    context "when remote status is 'TIMED_OUT'" do
      let(:failed_sfn_status) { WorkflowRun::STATUS[:timed_out] }

      it "sets remote status to failed" do
        @mock_aws_clients[:states].stub_responses(:describe_execution, fake_failed_sfn_execution_description)
        @workflow_running.update_status
        expect(@workflow_running.status).to eq(WorkflowRun::STATUS[:failed])
      end
    end

    context "when remote status is 'ABORTED'" do
      let(:failed_sfn_status) { WorkflowRun::STATUS[:aborted] }

      it "sets remote status to failed" do
        @mock_aws_clients[:states].stub_responses(:describe_execution, fake_failed_sfn_execution_description)
        @workflow_running.update_status
        expect(@workflow_running.status).to eq(WorkflowRun::STATUS[:failed])
      end
    end

    it "reports run failures and sets error_message" do
      @mock_aws_clients[:states].stub_responses(:describe_execution, fake_failed_sfn_execution_description)
      @mock_aws_clients[:states].stub_responses(:get_execution_history, fake_error_sfn_execution_history)
      expect(Rails.logger).to receive(:error).with(match(/SampleFailedEvent/))

      @workflow_running.update_status
      expect(@workflow_running.status).to eq(WorkflowRun::STATUS[:failed])
      expect(@workflow_running.error_message).to eq(failed_sfn_error_message)
      expect(@workflow_running.time_to_finalized).to be_within(5.seconds).of fake_runtime
    end

    context "when there is an input error" do
      it "does not report error and sets error_message" do
        @mock_aws_clients[:states].stub_responses(:describe_execution, fake_failed_sfn_execution_description)
        @mock_aws_clients[:states].stub_responses(:get_execution_history, fake_bad_input_sfn_execution_history)
        expect(Rails.logger).not_to receive(:error).with(match(/SampleFailedEvent/))

        @workflow_running.update_status
        expect(@workflow_running.status).to eq(WorkflowRun::STATUS[:succeeded_with_issue])
        expect(@workflow_running.error_message).to eq(bad_input_error_message)
      end
    end

    context "when workflow run is finalized" do
      let(:fake_sfn_status) { "RUNNING" }

      before do
        allow(S3Util).to receive(:get_s3_file)
          .and_return(fake_sfn_execution_description.to_json)
      end

      context "when workflow run status is succeeded" do
        it "does not update status" do
          @workflow_running.update(status: WorkflowRun::STATUS[:succeeded])

          @workflow_running.update_status
          expect(@workflow_running.status).to eq(WorkflowRun::STATUS[:succeeded])
        end
      end

      context "when workflow run status is succeeded with issue" do
        it "does not update status" do
          @workflow_running.update(status: WorkflowRun::STATUS[:succeeded_with_issue])

          @workflow_running.update_status
          expect(@workflow_running.status).to eq(WorkflowRun::STATUS[:succeeded_with_issue])
        end
      end

      context "when workflow run status is failed" do
        it "does not update status" do
          @workflow_running.update(status: WorkflowRun::STATUS[:failed])

          @workflow_running.update_status
          expect(@workflow_running.status).to eq(WorkflowRun::STATUS[:failed])
        end
      end
    end

    it "triggers output metrics loading on success" do
      @mock_aws_clients[:states].stub_responses(:describe_execution, fake_sfn_execution_description)
      expect(@workflow_running).to receive(:load_cached_results)

      @workflow_running.update_status
      expect(@workflow_running.status).to eq(WorkflowRun::STATUS[:succeeded])
      expect(@workflow_running.time_to_finalized).to be_within(5.seconds).of fake_runtime
    end
  end

  describe "#error_message_display" do
    context "when error_message column is populated" do
      it "returns stored error_message" do
        @workflow_running.update(error_message: "stored error message")
        expect(@workflow_running.error_message_display).to eq("stored error message")
      end
    end

    context "when there is an input error" do
      it "returns error message in sfn execution" do
        @mock_aws_clients[:states].stub_responses(:describe_execution, fake_failed_sfn_execution_description)
        @mock_aws_clients[:states].stub_responses(:get_execution_history, fake_bad_input_sfn_execution_history)
        expect(@workflow_running.error_message_display).to eq(bad_input_error_message)
      end
    end

    context "when there is an unknown error" do
      it "returns parsed error" do
        @mock_aws_clients[:states].stub_responses(:describe_execution, fake_failed_sfn_execution_description)
        @mock_aws_clients[:states].stub_responses(:get_execution_history, fake_error_sfn_execution_history)
        expect(@workflow_running.error_message_display).to eq(failed_sfn_error_message)
      end
    end
  end

  describe "#output" do
    let(:fake_output_wdl_key) { "fake_output_wdl_key" }
    let(:fake_output_s3_key) { "fake_output_key" }
    let(:fake_output_s3_path) { "s3://fake_bucket/#{fake_output_s3_key}" }
    let(:workflow_run) { build_stubbed(:workflow_run) }

    subject { workflow_run.output(fake_output_wdl_key) }

    context "when output exists" do
      it "returns output content" do
        allow_any_instance_of(SfnExecution).to receive(:output_path) { fake_output_s3_path }
        fake_body = "fake body"
        fake_bucket = { fake_output_s3_key => { body: "fake body" } }
        @mock_aws_clients[:s3].stub_responses(:get_object, lambda { |context|
          fake_bucket[context.params[:key]] || 'NoSuchKey'
        })

        expect(subject).to eq(fake_body)
      end
    end

    context "when output does not exist in wdl" do
      it "returns nil" do
        allow_any_instance_of(SfnExecution).to receive(:output_path).and_raise(SfnExecution::OutputNotFoundError.new(fake_output_wdl_key, ['key_1', 'key_2']))

        expect { subject }.to raise_error(SfnExecution::OutputNotFoundError)
      end
    end

    context "when output does not exist in s3" do
      it "returns nil" do
        allow_any_instance_of(SfnExecution).to receive(:output_path) { fake_output_s3_path }
        @mock_aws_clients[:s3].stub_responses(:get_object, 'NoSuchKey')

        expect(subject).to be_nil
      end
    end
  end

  describe "#rerun" do
    let(:project) { create(:project) }
    let(:sample) { create(:sample, project: project) }
    let(:workflow_run) { create(:workflow_run, sample: sample) }

    subject { workflow_run.rerun }

    context "workflow is deprecated" do
      let(:workflow_run) { create(:workflow_run, sample: sample, deprecated: true) }

      it "raises an error" do
        expect { subject }.to raise_error(WorkflowRun::RerunDeprecatedWorkflowError)
      end
    end

    context "workflow is active" do
      before do
        allow(SfnCgPipelineDispatchService).to receive(:call) {
                                                 {
                                                   sfn_input_json: {},
                                                   sfn_execution_arn: "fake_sfn_execution_arn",
                                                 }
                                               }
      end

      it "updates current workflow run to deprecated" do
        subject
        expect(workflow_run.deprecated?).to be(true)
      end

      it "creates and returns new workflow run with same workflow type" do
        expect(subject.workflow).to eq(workflow_run.workflow)
        expect(sample.workflow_runs.count).to eq(2)
      end

      it "creates and returns new workflow run that references previous workflow" do
        expect(subject.rerun_from).to eq(workflow_run.id)
      end

      it "creates and returns new workflow run with the same inputs JSON" do
        expect(subject.inputs_json).to eq(workflow_run.inputs_json)
      end
    end
  end

  describe "#workflow_by_class" do
    let(:project) { create(:project) }
    let(:sample) { create(:sample, project: project) }
    let(:workflow_run) { create(:workflow_run, sample: sample, workflow: WorkflowRun::WORKFLOW[:consensus_genome]) }

    subject { workflow_run.send(:workflow_by_class) }

    it "returns an instance of the workflow-specific class" do
      expect(subject).to be_instance_of(ConsensusGenomeWorkflowRun)
      expect(subject).not_to be_instance_of(WorkflowRun)
    end
  end

  describe "#load_cached_results" do
    let(:project) { create(:project) }
    let(:sample) { create(:sample, project: project) }
    let(:workflow_run) { create(:workflow_run, sample: sample, workflow: WorkflowRun::WORKFLOW[:consensus_genome]) }
    @mock_result = { coverage_depth: 900, coverage_breadth: 0.9, total_reads: 200_000, ref_snps: 10, n_actg: 30_000, n_missing: 10, n_ambiguous: 0, percent_identity: 100.0, gc_percent: 40 }

    subject { workflow_run.send(:load_cached_results) }

    it "retrieves output metrics and updates the record column" do
      expect_any_instance_of(ConsensusGenomeWorkflowRun).to receive(:results).with(cacheable_only: true).and_return(@mock_result)

      expect(subject).to eq(true)
      expect(workflow_run.cached_results).to eq(@mock_result.to_json)
    end

    it "throws an error if the subclass does not implement the method" do
      expect(workflow_run).to receive(:workflow_by_class).and_return(WorkflowRun)

      expect { subject }.to raise_error(NotImplementedError)
    end

    it "reports errors in loading the metrics" do
      expect_any_instance_of(ConsensusGenomeWorkflowRun).to receive(:results).with(cacheable_only: true).and_raise(RuntimeError)
      expect(LogUtil).to receive(:log_error).with(
        "Error loading cached results",
        exception: RuntimeError,
        workflow_run_id: workflow_run.id
      )

      expect(subject).to eq(nil)
    end
  end

  describe "#inputs" do
    let(:parsed_input) { { "wetlab_protocol" => ConsensusGenomeWorkflowRun::WETLAB_PROTOCOL[:artic] } }
    let(:inputs_json) { parsed_input.to_json }
    let(:project) { create(:project) }
    let(:sample) { create(:sample, project: project) }
    let(:workflow_run) { create(:workflow_run, sample: sample, workflow: WorkflowRun::WORKFLOW[:consensus_genome], inputs_json: inputs_json) }
    let(:workflow_run_no_input) { create(:workflow_run, sample: sample, workflow: WorkflowRun::WORKFLOW[:consensus_genome]) }

    subject { workflow_run.send(:inputs) }

    it "calls JSON parse on the inputs_json column" do
      response = workflow_run.send(:inputs)

      expect(response).to eq(parsed_input)
    end

    it "returns null if missing input" do
      expect(workflow_run_no_input.inputs).to be_nil
    end
  end

  describe "#add_inputs" do
    let(:parsed_input) { { "start_from_mngs" => "true" } }
    let(:inputs_json) { parsed_input.to_json }
    let(:project) { create(:project) }
    let(:sample) { create(:sample, project: project) }
    let(:workflow_run) { create(:workflow_run, sample: sample, workflow: WorkflowRun::WORKFLOW[:amr], inputs_json: inputs_json) }
    let(:workflow_run_no_input) { create(:workflow_run, sample: sample, workflow: WorkflowRun::WORKFLOW[:amr]) }
    let(:new_parsed_input) { { "card_version" => "3.2.6" } }

    it "creates inputs JSON if inputs_json is nil" do
      workflow_run_no_input.add_inputs(parsed_input)
      workflow_run_no_input.reload
      expect(workflow_run_no_input.inputs_json).to eq(parsed_input.to_json)
    end

    it "appends to existing inputs if inputs_json is non-nil" do
      workflow_run.add_inputs(new_parsed_input)
      workflow_run.reload
      expect(workflow_run.inputs_json).to eq({ "start_from_mngs" => "true", "card_version" => "3.2.6" }.to_json)
    end

    it "overwrites existing values for the keys being added" do
      workflow_run.add_inputs({ "start_from_mngs" => "false" })
      workflow_run.reload
      expect(workflow_run.inputs_json).to eq({ "start_from_mngs" => "false" }.to_json)
    end
  end

  describe "#handle_sample_upload_failure" do
    before do
      @project = create(:project)
      @sample = create(:sample, project: @project)
      @workflow_run = create(:workflow_run, sample: @sample, status: WorkflowRun::STATUS[:created])
      @sample2 = create(:sample, project: @project)
      @workflow_run2 = create(:workflow_run, sample: @sample2, status: WorkflowRun::STATUS[:created])
      @sample_no_runs = create(:sample, project: @project)
    end

    it "marks the runs for one sample as failed" do
      subject = WorkflowRun.handle_sample_upload_failure(@sample)
      @workflow_run.reload

      expect(subject).to eq(1)
      expect(@workflow_run.status).to eq(WorkflowRun::STATUS[:failed])
    end

    it "marks the runs for multiple samples as failed" do
      subject = WorkflowRun.handle_sample_upload_failure([@sample, @sample2])
      @workflow_run.reload
      @workflow_run2.reload

      expect(subject).to eq(2)
      expect(@workflow_run.status).to eq(WorkflowRun::STATUS[:failed])
      expect(@workflow_run2.status).to eq(WorkflowRun::STATUS[:failed])
    end

    it "doesn't do anything if there are no matching runs" do
      subject = WorkflowRun.handle_sample_upload_failure(@sample_no_runs)

      expect(subject).to eq(0)
    end
  end

  describe "#handle_sample_upload_restart" do
    before do
      @project = create(:project)
      @sample = create(:sample, project: @project)
      @workflow_run = create(:workflow_run, sample: @sample, status: WorkflowRun::STATUS[:failed])
      @sample_no_runs = create(:sample, project: @project)
    end

    it "marks the failed workflow run as created again" do
      subject = WorkflowRun.handle_sample_upload_restart(@sample)
      @workflow_run.reload

      expect(subject).to be true
      expect(@workflow_run.status).to eq(WorkflowRun::STATUS[:created])
    end

    it "doesn't do anything if there are no matching runs" do
      subject = WorkflowRun.handle_sample_upload_restart(@sample_no_runs)

      expect(subject).to be_nil
    end
  end

  describe "#handle workflow run destroy" do
    before do
      @project = create(:project)
      @sample = create(:sample, project: @project)
      @workflow_run = create(:workflow_run, sample: @sample, status: WorkflowRun::STATUS[:failed])
    end

    it "can destroy a workflow run" do
      expect(@sample.workflow_runs.count).to eq(1)
      @workflow_run.destroy!
      expect(@sample.workflow_runs.count).to eq(0)
    end
  end

  describe "#parsed_cached_results" do
    let(:parsed_results) { { "accession_id" => "MN908947.3", "accession_name" => "Severe acute respiratory syndrome coronavirus 2 isolate Wuhan-Hu-1, complete genome", "taxon_id" => 463_676, "taxon_name" => "Severe acute respiratory syndrome coronavirus 2", "technology" => "Illumina", "wetlab_protocol" => "artic" } }
    let(:cached_results) { parsed_results.to_json }
    let(:project) { create(:project) }
    let(:sample) { create(:sample, project: project) }
    let(:workflow_run) { create(:workflow_run, sample: sample, workflow: WorkflowRun::WORKFLOW[:consensus_genome], cached_results: cached_results) }
    let(:workflow_run_no_results) { create(:workflow_run, sample: sample, workflow: WorkflowRun::WORKFLOW[:consensus_genome]) }

    it "calls JSON parse on the cached_results column" do
      response = workflow_run.send(:parsed_cached_results)

      expect(response).to eq(parsed_results)
    end

    it "returns null if missing results" do
      response = workflow_run_no_results.send(:parsed_cached_results)
      expect(response).to be_nil
    end
  end

  describe "#sort_workflow_runs" do
    before do
      create(:metadata_field, name: "ct_value", base_type: MetadataField::NUMBER_TYPE)

      human_hg = create(:host_genome, name: "Human")
      mosquito_hg = create(:host_genome, name: "Mosquito")

      @project = create(:project)
      sample = create(:sample, project: @project, host_genome_id: human_hg.id,
                               metadata_fields: {
                                 name: "Test Sample A", collection_location_v2: "Los Angeles, USA", ct_value: 1, water_control: "No", sample_type: "Cerebrospinal Fluid", nucleotide_type: "DNA",
                                 host_sex: "Female", host_age: 50, custom_metadata: "test a", "custom metadata space-separated" => "test a",
                               })
      sample3 = create(:sample, project: @project, host_genome_id: mosquito_hg.id,
                                metadata_fields: {
                                  name: "Test Sample B", collection_location_v2: "San Francisco, USA", ct_value: 2, water_control: "Yes", sample_type: "Nasopharyngeal Swab", nucleotide_type: "RNA",
                                  host_sex: "Male", host_age: 60, custom_metadata: "test b", "custom metadata space-separated" => "test b",
                                })
      sample2 = create(:sample, project: @project, host_genome_id: mosquito_hg.id,
                                metadata_fields: {
                                  name: "Test Sample B", collection_location_v2: "San Francisco, USA", ct_value: 2, water_control: "Yes", sample_type: "Nasopharyngeal Swab", nucleotide_type: "RNA",
                                  host_sex: "Male", host_age: 60, custom_metadata: "test b", "custom metadata space-separated" => "test b",
                                })
      # Note: workflow_runs two and three are created out of order for testing purposes
      @workflow_run = create(:workflow_run, sample: sample, status: WorkflowRun::STATUS[:created], created_at: 3.days.ago)
      @workflow_run3 = create(:workflow_run, sample: sample3, status: WorkflowRun::STATUS[:created], created_at: 2.days.ago)
      @workflow_run2 = create(:workflow_run, sample: sample2, status: WorkflowRun::STATUS[:created], created_at: 1.day.ago)

      @workflow_runs_input = WorkflowRun.where(id: [@workflow_run.id, @workflow_run2.id, @workflow_run3.id])
    end

    context "when invalid order by key passed" do
      let(:data_key) { "invalid_data_key" }

      it "returns unsorted workflow runs when order_dir is 'asc'" do
        asc_results = WorkflowRun.sort_workflow_runs(@workflow_runs_input, data_key, "asc")
        expect(asc_results.pluck(:id)).to eq(@workflow_runs_input.pluck(:id))
      end

      it "returns unsorted projects when order_dir is 'desc'" do
        desc_results = WorkflowRun.sort_workflow_runs(@workflow_runs_input, data_key, "desc")
        expect(desc_results.pluck(:id)).to eq(@workflow_runs_input.pluck(:id))
      end
    end

    context "when sorting workflow runs by creation date" do
      let(:data_key) { "createdAt" }

      it "returns workflow runs in ascending creation order when order_dir is 'asc'" do
        asc_results = WorkflowRun.sort_workflow_runs(@workflow_runs_input, data_key, "asc")
        expect(asc_results.pluck(:id)).to eq([@workflow_run.id, @workflow_run3.id, @workflow_run2.id])
      end

      it "returns workflow runs in descending creation order when order_dir is 'desc'" do
        desc_results = WorkflowRun.sort_workflow_runs(@workflow_runs_input, data_key, "desc")
        expect(desc_results.pluck(:id)).to eq([@workflow_run2.id, @workflow_run3.id, @workflow_run.id])
      end
    end

    context "when sorting workflow runs by sample name" do
      let(:data_key) { "sample" }

      it "returns workflow runs in ascending sample name order when order_dir is 'asc'" do
        asc_results = WorkflowRun.sort_workflow_runs(@workflow_runs_input, data_key, "asc")
        expect(asc_results.pluck(:id)).to eq([@workflow_run.id, @workflow_run3.id, @workflow_run2.id])
      end

      it "returns workflow runs in descending creation order when order_dir is 'desc'" do
        desc_results = WorkflowRun.sort_workflow_runs(@workflow_runs_input, data_key, "desc")
        expect(desc_results.pluck(:id)).to eq([@workflow_run2.id, @workflow_run3.id, @workflow_run.id])
      end
    end

    context "when sorting workflow runs by required metadata" do
      let(:data_key_list) { ["water_control", "sample_type", "nucleotide_type"] }

      before do
        # create workflow run with no metadata to test null-handling
        sample4 = create(:sample, project: @project)
        @workflow_run4 = create(:workflow_run, sample: sample4, status: WorkflowRun::STATUS[:created], created_at: 1.day.ago)

        @workflow_runs_with_null_data = WorkflowRun.where(id: [@workflow_run.id, @workflow_run2.id, @workflow_run3.id, @workflow_run4.id])
      end

      it "returns workflow runs in ascending order by metadata when order_dir is 'asc'" do
        data_key_list.each do |data_key|
          asc_results = WorkflowRun.sort_workflow_runs(@workflow_runs_with_null_data, data_key, "asc")
          expect(asc_results.pluck(:id)).to eq([@workflow_run4.id, @workflow_run.id, @workflow_run3.id, @workflow_run2.id])
        end
      end

      it "returns workflow runs in descending order by metadata when order_dir is 'desc'" do
        data_key_list.each do |data_key|
          desc_results = WorkflowRun.sort_workflow_runs(@workflow_runs_with_null_data, data_key, "desc")
          expect(desc_results.pluck(:id)).to eq([@workflow_run2.id, @workflow_run3.id, @workflow_run.id, @workflow_run4.id])
        end
      end
    end

    context "when sorting workflow runs by optional metadata" do
      let(:data_key_list) { ["ct_value"] }

      before do
        # create workflow run with no metadata to test null-handling
        sample4 = create(:sample, project: @project)
        @workflow_run4 = create(:workflow_run, sample: sample4, status: WorkflowRun::STATUS[:created], created_at: 1.day.ago)

        @workflow_runs_with_null_data = WorkflowRun.where(id: [@workflow_run.id, @workflow_run2.id, @workflow_run3.id, @workflow_run4.id])
      end

      it "returns workflow runs in ascending order by metadata when order_dir is 'asc'" do
        data_key_list.each do |data_key|
          asc_results = WorkflowRun.sort_workflow_runs(@workflow_runs_with_null_data, data_key, "asc")
          expect(asc_results.pluck(:id)).to eq([@workflow_run4.id, @workflow_run.id, @workflow_run3.id, @workflow_run2.id])
        end
      end

      it "returns workflow runs in descending order by metadata when order_dir is 'desc'" do
        data_key_list.each do |data_key|
          desc_results = WorkflowRun.sort_workflow_runs(@workflow_runs_with_null_data, data_key, "desc")
          expect(desc_results.pluck(:id)).to eq([@workflow_run2.id, @workflow_run3.id, @workflow_run.id, @workflow_run4.id])
        end
      end
    end

    context "when sorting workflow runs by custom metadata" do
      let(:data_key_list) { ["custom_metadata", "custom metadata space-separated"] }

      before do
        # create workflow run with no metadata to test null-handling
        sample4 = create(:sample, project: @project)
        @workflow_run4 = create(:workflow_run, sample: sample4, status: WorkflowRun::STATUS[:created], created_at: 1.day.ago)

        @workflow_runs_with_null_data = WorkflowRun.where(id: [@workflow_run.id, @workflow_run2.id, @workflow_run3.id, @workflow_run4.id])
      end

      it "returns workflow runs in ascending order by metadata when order_dir is 'asc'" do
        data_key_list.each do |data_key|
          asc_results = WorkflowRun.sort_workflow_runs(@workflow_runs_with_null_data, data_key, "asc")
          expect(asc_results.pluck(:id)).to eq([@workflow_run4.id, @workflow_run.id, @workflow_run3.id, @workflow_run2.id])
        end
      end

      it "returns workflow runs in descending order by metadata when order_dir is 'desc'" do
        data_key_list.each do |data_key|
          desc_results = WorkflowRun.sort_workflow_runs(@workflow_runs_with_null_data, data_key, "desc")
          expect(desc_results.pluck(:id)).to eq([@workflow_run2.id, @workflow_run3.id, @workflow_run.id, @workflow_run4.id])
        end
      end
    end

    context "when sorting workflow runs by metadata that does not belong to the workflow runs" do
      let(:data_key) { ["comorbidity"] }

      before do
        # Create metadata field that is not associated with the workflow runs' projects and host genomes
        create(:metadata_field, name: "comorbidity")
      end

      it "returns samples in ascending order by creation date when order_dir is 'asc'" do
        asc_results = WorkflowRun.sort_workflow_runs(@workflow_runs_input, data_key, "asc")
        expect(asc_results.pluck(:id)).to eq([@workflow_run.id, @workflow_run3.id, @workflow_run2.id])
      end

      it "returns samples in descending order by creation date when order_dir is 'desc'" do
        desc_results = WorkflowRun.sort_workflow_runs(@workflow_runs_input, data_key, "desc")
        expect(desc_results.pluck(:id)).to eq([@workflow_run2.id, @workflow_run3.id, @workflow_run.id])
      end
    end

    context "when sorting workflow runs by host" do
      let(:data_key) { "host" }

      it "returns workflow runs in ascending order by host when order_dir is 'asc'" do
        asc_results = WorkflowRun.sort_workflow_runs(@workflow_runs_input, data_key, "asc")
        expect(asc_results.pluck(:id)).to eq([@workflow_run.id, @workflow_run3.id, @workflow_run2.id])
      end

      it "returns workflow runs in descending order by host when order_dir is 'desc'" do
        desc_results = WorkflowRun.sort_workflow_runs(@workflow_runs_input, data_key, "desc")
        expect(desc_results.pluck(:id)).to eq([@workflow_run2.id, @workflow_run3.id, @workflow_run.id])
      end
    end

    context "when sorting workflow runs by input data" do
      let(:data_key_list) { ["referenceAccession", "wetlabProtocol", "technology", "medakaModel"] }

      before do
        # create workflow run with empty inputs_json data to test null-handling
        empty_input = {}.to_json

        low_val_input = {
          accession_id: "NC_006213.1",
          technology: "Illumina",
          wetlab_protocol: "artic",
          medaka_model: "test_model_a",
        }.to_json

        high_val_input = {
          accession_id: "NC_006213.2",
          technology: "ONT",
          wetlab_protocol: "midnight",
          medaka_model: "test_model_b",
        }.to_json

        @workflow_run4 = create(:workflow_run, sample: create(:sample, project: @project), status: WorkflowRun::STATUS[:created], created_at: 1.day.ago, inputs_json: empty_input)
        @workflow_run.update(inputs_json: low_val_input)
        @workflow_run3.update(inputs_json: high_val_input)
        @workflow_run2.update(inputs_json: high_val_input)

        @workflow_runs_with_null_data = WorkflowRun.where(id: [@workflow_run.id, @workflow_run2.id, @workflow_run3.id, @workflow_run4.id])
      end

      it "returns workflow runs in ascending order by input data when order_dir is 'asc'" do
        data_key_list.each do |data_key|
          asc_results = WorkflowRun.sort_workflow_runs(@workflow_runs_with_null_data, data_key, "asc")
          expect(asc_results.pluck(:id)).to eq([@workflow_run4.id, @workflow_run.id, @workflow_run3.id, @workflow_run2.id])
        end
      end

      it "returns workflow runs in descending order by input data when order_dir is 'desc'" do
        data_key_list.each do |data_key|
          desc_results = WorkflowRun.sort_workflow_runs(@workflow_runs_with_null_data, data_key, "desc")
          expect(desc_results.pluck(:id)).to eq([@workflow_run2.id, @workflow_run3.id, @workflow_run.id, @workflow_run4.id])
        end
      end
    end

    context "when sorting workflow runs by cached results" do
      let(:data_key_list) do
        ["totalReadsCG", "percentGenomeCalled", "coverageDepth", "gcPercent",
         "refSnps", "percentIdentity", "nActg", "nMissing", "nAmbiguous", "referenceAccessionLength",]
      end

      before do
        # create workflow run with empty cached result data to test null-handling
        empty_cached_result = {
          coverage_viz: {},
          quality_metrics: {},
        }.to_json

        low_val_cached_result = {
          coverage_viz: {
            coverage_depth: 0.9986289001103568,
          },
          quality_metrics: {
            n_actg: 29_852,
            n_ambiguous: 0,
            n_missing: 10,
            ref_snps: 7,
            total_reads: 187_444,
            percent_identity: 99.0,
            gc_percent: 38.0,
            percent_genome_called: 99.7,
            reference_genome_length: 29_903,
          },
        }.to_json

        high_val_cached_result = {
          coverage_viz: {
            coverage_depth: 1.9986289001103568,
          },
          quality_metrics: {
            n_actg: 29_853,
            n_ambiguous: 1,
            n_missing: 11,
            ref_snps: 8,
            total_reads: 187_445,
            percent_identity: 100.0,
            gc_percent: 39.0,
            percent_genome_called: 99.8,
            reference_genome_length: 29_904,
          },
        }.to_json

        @workflow_run4 = create(:workflow_run, sample: create(:sample, project: @project), status: WorkflowRun::STATUS[:created], created_at: 1.day.ago, cached_results: empty_cached_result)
        @workflow_run.update(cached_results: low_val_cached_result)

        @workflow_run3.update(cached_results: high_val_cached_result)
        @workflow_run2.update(cached_results: high_val_cached_result)

        @workflow_runs_with_null_data = WorkflowRun.where(id: [@workflow_run.id, @workflow_run2.id, @workflow_run3.id, @workflow_run4.id])
      end

      it "returns workflow runs in ascending order by cached results when order_dir is 'asc'" do
        data_key_list.each do |data_key|
          asc_results = WorkflowRun.sort_workflow_runs(@workflow_runs_with_null_data, data_key, "asc")
          expect(asc_results.pluck(:id)).to eq([@workflow_run4.id, @workflow_run.id, @workflow_run3.id, @workflow_run2.id])
        end
      end

      it "returns workflow runs in descending order by cached results when order_dir is 'desc'" do
        data_key_list.each do |data_key|
          desc_results = WorkflowRun.sort_workflow_runs(@workflow_runs_with_null_data, data_key, "desc")
          expect(desc_results.pluck(:id)).to eq([@workflow_run2.id, @workflow_run3.id, @workflow_run.id, @workflow_run4.id])
        end
      end
    end

    context "when sorting workflow runs by collection location" do
      let(:data_key) { "collection_location_v2" }

      before do
        # Ensures that location metadata field is valid for sample_four
        location_metadata_field = create(
          :metadata_field, name: 'collection_location_v2', base_type: MetadataField::LOCATION_TYPE
        )
        host_genome = create(:host_genome, name: "mock_host_genome")
        host_genome.metadata_fields << location_metadata_field
        sample4 = create(:sample, project: @project, name: "Test Sample C", created_at: 1.day.ago, host_genome: host_genome)
        @workflow_run4 = create(:workflow_run, sample: sample4, status: WorkflowRun::STATUS[:created], created_at: 1.day.ago)

        # Create sample_four with a lowest-value location name
        # and which stores location info in a location object (vs in its metadata's string_validated_value)
        location = create(:location, name: "California, USA", osm_id: 200, locationiq_id: 100)
        location_metadata = Metadatum.new(
          sample: sample4,
          metadata_field: location_metadata_field,
          key: "collection_location_v2",
          location: location
        )
        location_metadata.save!

        @workflow_runs_with_location_object = WorkflowRun.where(id: [@workflow_run.id, @workflow_run2.id, @workflow_run3.id, @workflow_run4.id])
      end

      it "returns samples in ascending order by pipeline run info when order_dir is 'asc'" do
        asc_results = WorkflowRun.sort_workflow_runs(@workflow_runs_with_location_object, data_key, "asc")
        expect(asc_results.pluck(:id)).to eq([@workflow_run4.id, @workflow_run.id, @workflow_run3.id, @workflow_run2.id])
      end

      it "returns samples in descending order by pipeline run info when order_dir is 'desc'" do
        desc_results = WorkflowRun.sort_workflow_runs(@workflow_runs_with_location_object, data_key, "desc")
        expect(desc_results.pluck(:id)).to eq([@workflow_run2.id, @workflow_run3.id, @workflow_run.id, @workflow_run4.id])
      end
    end
  end

  # rubocop:disable Naming/VariableNumber
  describe "#workflow_version_at_least" do
    context "when comparing workflow versions" do
      before do
        @project = create(:project)
        sample = create(:sample, project: @project)
        @workflow_run_v0_1_0 = create(:workflow_run, sample: sample, status: WorkflowRun::STATUS[:created], wdl_version: "0.1.0")
        @workflow_run_v0_3_1 = create(:workflow_run, sample: sample, status: WorkflowRun::STATUS[:created], wdl_version: "0.3.1")
        @workflow_run_v1_3_0_beta = create(:workflow_run, sample: sample, status: WorkflowRun::STATUS[:created], wdl_version: "1.3.0-beta.8-0b8959d")
        @workflow_run_v1_3_0 = create(:workflow_run, sample: sample, status: WorkflowRun::STATUS[:created], wdl_version: "1.3.0")
      end

      it "correctly compares major versions" do
        comparison = @workflow_run_v0_1_0.workflow_version_at_least("1.0.0")
        expect(comparison).to eq(false)
      end

      it "correctly compares minor versions" do
        comparison = @workflow_run_v1_3_0.workflow_version_at_least("1.2.0")
        expect(comparison).to eq(true)
      end

      it "correctly compares patch versions" do
        comparison = @workflow_run_v0_3_1.workflow_version_at_least("0.3.0")
        expect(comparison).to eq(true)
      end

      it "correctly compares beta versions" do
        comparison = @workflow_run_v1_3_0_beta.workflow_version_at_least("1.3.0")
        expect(comparison).to eq(false)
      end

      it "correctly compares major versions to beta versions" do
        comparison = @workflow_run_v1_3_0.workflow_version_at_least("1.3.0-beta.8-0b8959d")
        expect(comparison).to eq(true)
      end
    end
  end
  # rubocop:enable Naming/VariableNumber
end
