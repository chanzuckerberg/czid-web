require 'rails_helper'

RSpec.describe PhyloTreeNg, type: :model do
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
  let(:fake_dispatch_response) do
    {
      sfn_input_json: {},
      sfn_execution_arn: fake_sfn_execution_arn,
    }
  end

  before do
    @project = create(:project)
    sample_one = create(:sample, project: @project)
    @pr_one = create(:pipeline_run, sample: sample_one)
    sample_two = create(:sample, project: @project)
    @pr_two = create(:pipeline_run, sample: sample_two)
    @inputs_json = { pipeline_run_ids: [@pr_one.id, @pr_two.id], tax_id: 1 }

    @phylo_tree_running = create(:phylo_tree_ng,
                                 name: "test_phylo_tree_ng",
                                 status: WorkflowRun::STATUS[:running],
                                 sfn_execution_arn: fake_sfn_execution_arn,
                                 inputs_json: @inputs_json)

    @failed_phylo_tree = create(:phylo_tree_ng,
                                name: "failed_phylo_tree_ng",
                                status: WorkflowRun::STATUS[:failed],
                                sfn_execution_arn: fake_sfn_execution_arn,
                                inputs_json: @inputs_json)

    @mock_aws_clients = {
      s3: Aws::S3::Client.new(stub_responses: true),
      states: Aws::States::Client.new(stub_responses: true),
    }
    allow(AwsClient).to receive(:[]) { |client|
      @mock_aws_clients[client]
    }
  end

  context "#update_status" do
    it "checks and updates run statuses" do
      @mock_aws_clients[:states].stub_responses(:describe_execution, fake_sfn_execution_description)

      @phylo_tree_running.update_status
      expect(@phylo_tree_running).to have_attributes(status: fake_sfn_execution_description[:status])
    end

    it "accepts a run status as an argument" do
      new_status = "FAILED"

      @phylo_tree_running.update_status(new_status)
      expect(@phylo_tree_running).to have_attributes(status: new_status)
    end

    it "reports run failures" do
      @mock_aws_clients[:states].stub_responses(:describe_execution, fake_failed_sfn_execution_description)
      @mock_aws_clients[:states].stub_responses(:get_execution_history, fake_error_sfn_execution_history)
      expect(Rails.logger).to receive(:error).with(match(/PhyloTreeNgFailedEvent/))

      @phylo_tree_running.update_status
      expect(@phylo_tree_running.status).to eq(WorkflowRun::STATUS[:failed])
    end
  end

  describe "#rerun" do
    let(:phylo_tree_ng) do
      create(:phylo_tree_ng,
             name: "old_tree",
             inputs_json: @inputs_json)
    end

    subject { phylo_tree_ng.rerun }

    context "phylo tree is deprecated" do
      let(:phylo_tree_ng) do
        create(:phylo_tree_ng,
               name: "deprecated_tree",
               inputs_json: @inputs_json,
               deprecated: true)
      end

      it "raises an error" do
        expect { subject }.to raise_error(PhyloTreeNg::RerunDeprecatedPhyloTreeNgError)
      end
    end

    context "phylo tree is active" do
      before do
        allow(SfnPhyloTreeNgDispatchService).to receive(:call) {
          {
            sfn_input_json: {},
            sfn_execution_arn: "fake_sfn_execution_arn",
          }
        }
      end

      it "updates current phylo tree to be deprecated" do
        expect(phylo_tree_ng.deprecated?).to be(false)
        subject
        expect(phylo_tree_ng.deprecated?).to be(true)
      end

      it "creates and returns new phylo tree with appropriate fields" do
        new_tree = subject

        expect(new_tree).to have_attributes(
          name: phylo_tree_ng.name,
          rerun_from: phylo_tree_ng.id,
          inputs_json: phylo_tree_ng.inputs_json,
          project_id: phylo_tree_ng.project_id,
          user_id: phylo_tree_ng.user_id,
          status: WorkflowRun::STATUS[:created]
        )
      end
    end
  end

  describe "#create_visualization" do
    context "phylo tree is created" do
      let(:phylo_tree_ng) do
        create(:phylo_tree_ng,
               name: "new_tree",
               inputs_json: @inputs_json)
      end
      it "creates a new visualization for the phylo tree automatically" do
        data = { "treeNgId" => phylo_tree_ng.id }
        expect(Visualization.last.data).to eq(data)
      end
    end
  end

  describe ".editable" do
    let(:user) { create(:user) }
    let(:project) { create(:project, users: [user]) }

    let(:sample) { create(:sample, project: project) }
    let(:pipeline_run) { create(:pipeline_run, sample: sample) }

    let(:other_project) { create(:project) }
    let(:other_sample) { create(:sample, project: other_project) }
    let(:other_pipeline_run) { create(:pipeline_run, sample: other_sample) }

    let(:tree1) { create(:phylo_tree_ng, user: user, project: project, pipeline_runs: [pipeline_run]) }
    let(:tree2) { create(:phylo_tree_ng, user: user, project: project) }
    let(:tree3) { create(:phylo_tree_ng, pipeline_runs: [other_pipeline_run]) }
    let(:tree4) { create(:phylo_tree_ng) }

    subject { PhyloTreeNg.editable(user) }

    it "returns only trees where the user can edit the project and see all pipeline runs" do
      _ = [tree1, tree2, tree3, tree4]

      expect(subject.pluck(:id)).to eq([tree1.id])
    end
  end
end
