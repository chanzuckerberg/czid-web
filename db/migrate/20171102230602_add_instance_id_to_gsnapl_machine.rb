class AddInstanceIdToGsnaplMachine < ActiveRecord::Migration[5.1]
  def change
    add_column :gsnapl_machines, :instance_id, :string
  end
end
