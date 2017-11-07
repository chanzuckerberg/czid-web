class GsnaplMachinesController < ApplicationController
  before_action :set_gsnapl_machine, only: :destroy

  def create
    @gsnapl_machine = GsnaplMachine.create(gsnapl_machine_params)
    # To do: check there's actually an instance at the IP (or other security checks)
    @gsnapl_machine.save
  end

  def index
    @gsnapl_machines = GsnaplMachine.all
    render plain: @gsnapl_machines.to_json
  end

  def show_ips
    @gsnapl_machines = GsnaplMachine.all
    @ips_comma_separated = @gsnapl_machines.map(&:ip).join(",")
    render plain: @ips_comma_separated
  end

  def show_instance_ids
    @gsnapl_machines = GsnaplMachine.all
    @instance_ids_comma_separated = @gsnapl_machines.map(&:instance_id).join(",")
    render plain: @instance_ids_comma_separated
  end

  def destroy
    @gsnapl_machine.destroy
    respond_to do |format|
      format.html
      format.json { head :no_content }
    end
  end

  private

  def set_gsnapl_machine
    @gsnapl_machine = GsnaplMachine.find(params[:id])
  end

  def gsnapl_machine_params
    params.require(:gsnapl_machine).permit(:ip, :instance_id)
  end
end
