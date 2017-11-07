class MachineRunsController < ApplicationController
  before_action :set_machine_run, only: :destroy

  def create
    @machine = Machine.find_by(ip: machine_run_params[:machine_ip])
    @machine_run = MachineRun.create(machine_id: @machine.id, aws_batch_job_id: machine_run_params[:aws_batch_job_id])
    # To do: security checks
    @machine_run.save
  end

  def index
    @machine_runs = MachineRun.all
    render plain: @machine_runs.to_json
  end

  def destroy
    @machine_run.destroy
    respond_to do |format|
      format.html
      format.json { head :no_content }
    end
  end

  private

  def set_machine_run
    @machine_run = MachineRun.find(params[:id])
  end

  def machine_run_params
    params.permit(:aws_batch_job_id, :machine_ip)
  end
end
