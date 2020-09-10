class WorkflowRunsController < ApplicationController
  before_action :set_workflow_run, only: [:show, :results]

  def show
    render(
      json: @workflow_run.as_json,
      status: :ok
    )
  end

  def results
    render(
      json: @workflow_run.results,
      status: :ok
    )
  rescue NameError
    render(
      json: { status: "Workflow Run action not supported" },
      status: :not_found
    )
  end

  private

  def set_workflow_run
    workflow_run = current_power.workflow_runs.find(params[:id])
    workflow_class = WorkflowRun::WORKFLOW_CLASS[workflow_run.workflow]
    @workflow_run = workflow_class ? workflow_run.becomes(workflow_class) : workflow_run
  rescue ActiveRecord::RecordNotFound
    @workflow_run = nil
    render(
      json: { status: "Workflow Run not found" },
      status: :not_found
    )
  end
end
