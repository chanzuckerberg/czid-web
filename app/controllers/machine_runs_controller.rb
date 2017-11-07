class GsnaplRunsController < ApplicationController
  before_action :set_gsnapl_run, only: :destroy

  def create
    @gsnapl_machine = GsnaplMachine.find_by(ip: gsnapl_run_params[:gsnapl_machine_ip])
    @gsnapl_run = GsnaplRun.create(gsnapl_machine_id: @gsnapl_machine.id, aws_batch_job_id: gsnapl_run_params[:aws_batch_job_id])
    # To do: security checks
    @gsnapl_run.save
  end

  def index
    @gsnapl_runs = GsnaplRun.all
    render plain: @gsnapl_runs.to_json
  end

  def destroy
    @gsnapl_run.destroy
    respond_to do |format|
      format.html
      format.json { head :no_content }
    end
  end

  private

  def set_gsnapl_run
    @gsnapl_run = GsnaplRun.find(params[:id])
  end

  def gsnapl_run_params
    params.permit(:aws_batch_job_id, :gsnapl_machine_ip)
  end
end
