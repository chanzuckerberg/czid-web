require 'rails_helper'

RSpec.shared_examples "private action" do |action, options = {}|
  # options:
  # * admin_only : boolean
  # * action type : ['GET', 'PUT']
  options[:action_type] ||= "GET"

  context "Joe" do
    before do
      sign_in @joe
    end

    describe "#{options[:action_type]} /#{action}" do
      context "for workflow run from own sample" do
        it options[:admin_only] ? "returns not found error" : "succeeds" do
          project = create(:project, users: [@joe])
          sample = create(:sample, project: project, user: @joe)
          workflow_run = create(:workflow_run, sample: sample, workflow: WorkflowRun::WORKFLOW[:consensus_genome])

          get action, params: { id: workflow_run.id }

          if options[:admin_only]
            # redirected to root
            expect(response).to redirect_to root_path
          else
            expect(response).to have_http_status :ok
          end
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

  context "Access control" do
    before do
      allow_any_instance_of(WorkflowRun).to receive(:rerun)
    end

    # access control tests
    include_examples "private action", :show
    include_examples "private action", :results
    include_examples "private action", :rerun, admin_only: true
  end

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
          expect(json.keys).to contain_exactly(:coverage_viz, :quality_metrics, :taxon_info)
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

  context "Admin" do
    before do
      sign_in @admin
    end

    describe "PUT /rerun" do
      before do
        @project = create(:project, users: [@joe])
        @sample = create(:sample, project: @project, user: @joe)
        @workflow_run = create(:workflow_run, sample: @sample, workflow: WorkflowRun::WORKFLOW[:consensus_genome])
      end

      it "creates a new workflow run, dispatches and deprecates previous run" do
        expect(SfnCGPipelineDispatchService).to receive(:call).with(instance_of(WorkflowRun))

        put :rerun, params: { id: @workflow_run.id }

        result_workflow_runs = @sample.workflow_runs
        expect(@sample.workflow_runs.count).to eq(2)

        expect(result_workflow_runs[0].id).to eq(@workflow_run.id)
        expect(result_workflow_runs[0].deprecated).to eq(true)

        expect(result_workflow_runs[1].deprecated).to eq(false)
      end
    end
  end
end
