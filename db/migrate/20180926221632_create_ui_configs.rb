class CreateUiConfigs < ActiveRecord::Migration[5.1]
  def change
    create_table :ui_configs do |t|
      t.float :min_nt_z
      t.float :min_nr_z
      t.integer :min_nt_rpm
      t.integer :min_nr_rpm
      t.integer :top_n

      t.timestamps
    end

    UiConfig.create(min_nt_z: 1, min_nr_z: 1, min_nt_rpm: 1, min_nr_rpm: 1, top_n: 3)
  end
end
