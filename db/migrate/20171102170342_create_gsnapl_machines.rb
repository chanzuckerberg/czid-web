class CreateGsnaplMachines < ActiveRecord::Migration[5.1]
  def change
    create_table :gsnapl_machines do |t|
      t.string :ip

      t.timestamps
    end
  end
end
