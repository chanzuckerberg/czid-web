class AddIndexToGsnaplMachine < ActiveRecord::Migration[5.1]
  def change
    add_index :gsnapl_machines, :ip
  end
end
