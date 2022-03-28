require "rails_helper"

describe WorkflowRun, type: :model do
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
      status: "SUCCEEDED",
    }
  end
  let(:fake_failed_sfn_execution_description) do
    {
      execution_arn: fake_sfn_execution_arn,
      input: "{}",
      # AWS SDK rounds to second
      start_date: Time.zone.now.round,
      state_machine_arn: fake_sfn_arn,
      status: "FAILED",
    }
  end
  let(:fake_error_sfn_execution_history) do
    {
      events: [
        {
          id: 1,
          execution_failed_event_details: { error: "dummy_error" },
          timestamp: Time.zone.now,
          type: "dummy_type",
        },
      ],
    }
  end
  let(:fake_bad_input_sfn_execution_history) do
    {
      events: [
        {
          id: 1,
          execution_failed_event_details: { error: "InsufficientReadsError" },
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

  context "#in_progress" do
    it "loads Consensus Genome workflows in progress" do
      res = WorkflowRun.in_progress(WorkflowRun::WORKFLOW[:consensus_genome])
      expect(res).to eq([@workflow_running, @second_workflow_running])
    end

    it "loads all workflow runs in progress" do
      expect(WorkflowRun.in_progress).to eq([@workflow_running, @second_workflow_running])
    end
  end

  context "#update_status" do
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

    it "reports run failures" do
      @mock_aws_clients[:states].stub_responses(:describe_execution, fake_failed_sfn_execution_description)
      @mock_aws_clients[:states].stub_responses(:get_execution_history, fake_error_sfn_execution_history)
      expect(Rails.logger).to receive(:error).with(match(/SampleFailedEvent/))

      @workflow_running.update_status
      expect(@workflow_running.status).to eq(WorkflowRun::STATUS[:failed])
      expect(@workflow_running.time_to_finalized).to be_within(5.seconds).of fake_runtime
    end

    it "detects input errors and does not report error" do
      @mock_aws_clients[:states].stub_responses(:describe_execution, fake_failed_sfn_execution_description)
      @mock_aws_clients[:states].stub_responses(:get_execution_history, fake_bad_input_sfn_execution_history)
      expect(Rails.logger).not_to receive(:error).with(match(/SampleFailedEvent/))

      @workflow_running.update_status
      expect(@workflow_running.status).to eq(WorkflowRun::STATUS[:succeeded_with_issue])
    end

    it "triggers output metrics loading on success" do
      @mock_aws_clients[:states].stub_responses(:describe_execution, fake_sfn_execution_description)
      expect(@workflow_running).to receive(:load_cached_results)

      @workflow_running.update_status
      expect(@workflow_running.status).to eq(WorkflowRun::STATUS[:succeeded])
      expect(@workflow_running.time_to_finalized).to be_within(5.seconds).of fake_runtime
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
end
