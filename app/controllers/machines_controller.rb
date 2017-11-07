class MachinesController < ApplicationController
  before_action :set_machine, only: :destroy

  def create
    @machine = Machine.create(machine_params)
    # To do: check there's actually an instance at the IP (or other security checks)
    @machine.save
  end

  def index
    @machines = Machine.all
    render plain: @machines.to_json
  end

  def show_ips
    @machines = Machine.where(service: machine_params[:service])
    @ips_comma_separated = @machines.map(&:ip).join(",")
    render plain: @ips_comma_separated
  end

  def show_instance_ids
    @machines = Machine.where(service: machine_params[:service])
    @instance_ids_comma_separated = @machines.map(&:instance_id).join(",")
    render plain: @instance_ids_comma_separated
  end

  def destroy
    @machine.destroy
    respond_to do |format|
      format.html
      format.json { head :no_content }
    end
  end

  private

  def set_machine
    @machine = Machine.find(params[:id])
  end

  def machine_params
    params.require(:machine).permit(:ip, :instance_id, :service)
  end
end
