require "rails_helper"
require "webmock/rspec"

RSpec.describe PipelineRunsHelper, type: :helper do
  describe "#get_succeeded_pipeline_run_ids_for_samples" do
    before do
      @joe = create(:joe)
    end
    it "returns succeeded pipeline runs" do
      @project = create(:project, users: [@joe])
      @sample_one = create(:sample, project: @project,
                                    pipeline_runs_data: [{ finalized: 1, job_status: PipelineRun::STATUS_CHECKED }])
      @sample_two = create(:sample, project: @project,
                                    pipeline_runs_data: [{ finalized: 1, job_status: PipelineRun::STATUS_FAILED }])
      @sample_three = create(:sample, project: @project,
                                      pipeline_runs_data: [{ finalized: 0, job_status: PipelineRun::STATUS_RUNNING }])

      project_samples = Sample.where(project_id: @project.id)
      pipeline_runs = helper.get_succeeded_pipeline_runs_for_samples(project_samples)

      expect(pipeline_runs.map(&:id)).to eq([@sample_one.first_pipeline_run.id])
    end

    it "returns failed error in strict mode" do
      @project = create(:project, users: [@joe])
      @sample_one = create(:sample, project: @project,
                                    pipeline_runs_data: [{ finalized: 1, job_status: PipelineRun::STATUS_CHECKED }])
      @sample_two = create(:sample, project: @project,
                                    pipeline_runs_data: [{ finalized: 1, job_status: PipelineRun::STATUS_FAILED }])

      project_samples = Sample.where(project_id: @project.id)

      expect do
        helper.get_succeeded_pipeline_runs_for_samples(project_samples, true)
      end.to raise_error.with_message(PipelineRunsHelper::PIPELINE_RUN_FAILED_ERROR)
    end

    it "returns still running error in strict mode" do
      @project = create(:project, users: [@joe])
      @sample_one = create(:sample, project: @project,
                                    pipeline_runs_data: [{ finalized: 1, job_status: PipelineRun::STATUS_CHECKED }])
      @sample_two = create(:sample, project: @project,
                                    pipeline_runs_data: [{ finalized: 0, job_status: PipelineRun::STATUS_RUNNING }])

      project_samples = Sample.where(project_id: @project.id)

      expect do
        helper.get_succeeded_pipeline_runs_for_samples(project_samples, true)
      end.to raise_error.with_message(PipelineRunsHelper::PIPELINE_RUN_STILL_RUNNING_ERROR)
    end

    it "correctly checks the latest pipeline_run" do
      travel_to 2.days.ago do
        @project = create(:project, users: [@joe])
        @sample_one = create(:sample, project: @project,
                                      pipeline_runs_data: [{ finalized: 1, job_status: PipelineRun::STATUS_FAILED }])
      end

      travel_to 1.day.ago do
        create(:pipeline_run, sample: @sample_one, finalized: 1, job_status: PipelineRun::STATUS_FAILED)
      end

      # The latest pipeline run succeeds.
      first_pipeline_run = create(:pipeline_run, sample: @sample_one, finalized: 1, job_status: PipelineRun::STATUS_CHECKED)

      project_samples = Sample.where(project_id: @project.id)
      pipeline_runs = helper.get_succeeded_pipeline_runs_for_samples(project_samples)

      expect(pipeline_runs.map(&:id)).to eq([first_pipeline_run.id])
    end
  end

  describe "#parse_sfn_execution_history_hash" do
    let(:aws_cli_stdout) { file_fixture("helpers/pipeline_runs_helper/#{fixture_file}").read }

    subject do
      helper.parse_sfn_execution_history_hash(JSON.parse(aws_cli_stdout))
    end

    shared_examples "check output" do |fixture_file_name, expected_result|
      context "When processing #{fixture_file_name}" do
        let(:fixture_file) { fixture_file_name }
        it { is_expected.to eq(expected_result) }
      end
    end

    include_examples(
      "check output",
      "sfn-execution-history_aborted.json",
      "1" => { "stage" => "HostFilter", "status" => "FAILED" }
    )
    include_examples(
      "check output",
      "sfn-execution-history_failed-hostfiltering.json",
      "1" => { "stage" => "HostFilter", "status" => "FAILED" }
    )
    include_examples(
      "check output",
      "sfn-execution-history_failed-nonhostalignment.json",
      "1" => { "stage" => "HostFilter", "status" => "SUCCEEDED" },
      "2" => { "stage" => "NonHostAlignment", "status" => "FAILED" }
    )
    include_examples(
      "check output",
      "sfn-execution-history_succeeded.json",
      "1" => { "stage" => "HostFilter", "status" => "SUCCEEDED" },
      "2" => { "stage" => "NonHostAlignment", "status" => "SUCCEEDED" },
      "3" => { "stage" => "Postprocess", "status" => "SUCCEEDED" },
      "4" => { "stage" => "Experimental", "status" => "SUCCEEDED" }
    )
    include_examples(
      "check output",
      "sfn-execution-history_timeout.json",
      "1" => { "stage" => "HostFilter", "status" => "SUCCEEDED" },
      "2" => { "stage" => "NonHostAlignment", "status" => "SUCCEEDED" },
      "3" => { "stage" => "Postprocess", "status" => "FAILED" }
    )
    include_examples(
      "check output",
      "sfn-execution-history_in-progress.json",
      "1" => { "stage" => "HostFilter", "status" => "SUCCEEDED" },
      "2" => { "stage" => "NonHostAlignment", "status" => "RUNNING" }
    )
  end

  describe "#sfn_info" do
    let(:sfn_execution_arn) { "arn:aws:states:us-west-2:123456789012:execution:idseq-dev-main:idseq-1234567890" }
    let(:run_id) { 12_345 }
    let(:stage_number) { 1 }

    subject do
      helper.sfn_info(sfn_execution_arn, run_id, stage_number)
    end

    let(:aws_cli_stdout) { "" }
    let(:aws_cli_stderr) { "" }
    let(:aws_cli_exitstatus) { 0 }
    before do
      expect(Open3)
        .to receive(:capture3)
        .with("aws", "stepfunctions", "get-execution-history", "--output", "json", "--execution-arn", sfn_execution_arn)
        .and_return([aws_cli_stdout, aws_cli_stderr, instance_double(Process::Status, exitstatus: aws_cli_exitstatus)])
    end

    context "when arn doesn't exist" do
      let(:aws_cli_stderr) { "An error occurred (ExecutionDoesNotExist) when calling the GetExecutionHistory operation: Execution Does Not Exist: '#{sfn_execution_arn}'" }
      let(:aws_cli_exitstatus) { 255 }

      it { is_expected.to eq([PipelineRunStage::STATUS_FAILED, nil]) }
    end

    context "when arn exists" do
      let(:aws_cli_stdout) { file_fixture("helpers/pipeline_runs_helper/#{fixture_file}").read }

      context "and an error happened during stage 2" do
        let(:fixture_file) { "sfn-execution-history_failed-nonhostalignment.json" }

        context "and fetching status for stage 1" do
          let(:stage_number) { 1 }
          it { is_expected.to eq(["SUCCEEDED", nil]) }
        end

        context "and fetching status for stage 2" do
          let(:stage_number) { 2 }
          it { is_expected.to eq(["FAILED", nil]) }
        end
      end

      context "and it is in progress of stage 2" do
        let(:fixture_file) { "sfn-execution-history_in-progress.json" }

        context "and fetching status for stage 1" do
          let(:stage_number) { 1 }
          it { is_expected.to eq(["SUCCEEDED", nil]) }
        end

        context "and fetching status for stage 2" do
          let(:stage_number) { 2 }
          it { is_expected.to eq(["RUNNING", nil]) }
        end

        context "and fetching status for stage 3" do
          let(:stage_number) { 3 }
          it { is_expected.to eq(["PENDING", nil]) }
        end
      end
    end
  end
end
