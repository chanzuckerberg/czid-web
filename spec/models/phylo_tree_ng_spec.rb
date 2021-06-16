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
      it "updates current phylo tree to be deprecated" do
        expect(phylo_tree_ng.deprecated?).to be(false)
        subject
        expect(phylo_tree_ng.deprecated?).to be(true)
      end

      # TODO(julie): Uncomment and fill out the following tests when the dispatch service is ready.
      # it "creates and returns new phylo tree that references previous phylo tree" do
      # end

      # it "creates and returns new phylo tree with the same inputs JSON" do
      # end
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
end
