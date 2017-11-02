class GsnaplMachinesController < ApplicationController
  before_action :set_gsnapl_machine, only: :destroy

  def create
    @gsnapl_machine = GsnaplMachine.create(gsnapl_machine_params)
    # To do: check there's actually an instance at the IP (or other security checks)

    respond_to do |format|
      if @gsnapl_machine.save
        format.html
        format.json { render json: status: :created, location: @gsnapl_machine }
      else
        format.html
        format.json { render json: @gsnapl_machine.errors, status: :unprocessable_entity }
      end
    end
  end

  def index
    @gsnapl_machines = GsnaplMachine.all
    @gsnapl_ips_comma_separated = @gsnapl_machines.map(&:ip).join(",")
    render plain: @gsnapl_ips_comma_separated
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
    params.require(:gsnapl_machine).permit(:ip)
  end
end
