require 'rails_helper'

RSpec.shared_examples "private action" do |action|
  context "Joe" do
    before do
      sign_in @joe
    end

    describe "GET /#{action}" do
      context "for workflow run from own sample" do
        it "succeeds" do
          project = create(:project, users: [@joe])
          sample = create(:sample, project: project, user: @joe)
          workflow_run = create(:workflow_run, sample: sample, workflow: WorkflowRun::WORKFLOW[:consensus_genome])

          get action, params: { id: workflow_run.id }

          expect(response).to have_http_status :ok
        end
      end

      context "for workflow run from another user's sample" do
        it "returns not found error" do
          project = create(:project)
          sample = create(:sample, project: project)
          workflow_run = create(:workflow_run, sample: sample, workflow: WorkflowRun::WORKFLOW[:consensus_genome])

          get action, params: { id: workflow_run.id }

          expect(response).to have_http_status :not_found
          expect(JSON.parse(response.body, symbolize_names: true)[:status]).to eq("Workflow Run not found")
        end
      end
    end
  end

  context "Admin" do
    before do
      sign_in @admin
    end

    describe "GET /#{action}" do
      context "for workflow run from own sample" do
        it "succeeds" do
          project = create(:project, users: [@admin])
          sample = create(:sample, project: project, user: @admin)
          workflow_run = create(:workflow_run, sample: sample, workflow: WorkflowRun::WORKFLOW[:consensus_genome])

          get action, params: { id: workflow_run.id }

          expect(response).to have_http_status :ok
        end
      end

      context "for workflow run from another user's sample" do
        it "succeeds" do
          project = create(:project)
          sample = create(:sample, project: project)
          workflow_run = create(:workflow_run, sample: sample, workflow: WorkflowRun::WORKFLOW[:consensus_genome])

          get action, params: { id: workflow_run.id }

          expect(response).to have_http_status :ok
        end
      end
    end
  end
end

RSpec.describe WorkflowRunsController, type: :controller do
  create_users

  # access control tests
  include_examples "private action", :show
  include_examples "private action", :results

  context "Joe" do
    before do
      sign_in @joe
    end

    describe "GET /results" do
      before do
        @project = create(:project, users: [@joe])
        @sample = create(:sample, project: @project, user: @joe)
      end

      context "for consensus genome workflow" do
        it "returns success response" do
          workflow_run = create(:workflow_run, sample: @sample, workflow: WorkflowRun::WORKFLOW[:consensus_genome])

          get :results, params: { id: workflow_run.id }

          expect(response).to have_http_status :ok
          json = JSON.parse(response.body, symbolize_names: true)
          expect(json.keys).to contain_exactly(:coverage_viz, :quality_metrics, :taxon_name)
        end
      end

      context "for short_read_mngs pipeline" do
        it "returns not found error" do
          workflow_run = create(:workflow_run, sample: @sample, workflow: WorkflowRun::WORKFLOW[:short_read_mngs])

          get :results, params: { id: workflow_run.id }

          expect(response).to have_http_status :not_found
          expect(JSON.parse(response.body, symbolize_names: true)[:status]).to eq("Workflow Run action not supported")
        end
      end
    end
  end
end
