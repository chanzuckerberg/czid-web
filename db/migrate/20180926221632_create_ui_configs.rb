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

    # Vince -- Mar 15 2023:
    # Historically, we had a `UiConfig` model with above table, but no longer.
    # As part of this migration file, the model created the below row info.
    # However, since model is no longer in code, if original `UiConfig.create`
    # was called, this migration would explode. But a future migration needs
    # this table to exist so it can be dropped. So the table migration above
    # stands, but the row creation aspect has been commented out.
    # UiConfig.create(min_nt_z: 1, min_nr_z: 1, min_nt_rpm: 1, min_nr_rpm: 1, top_n: 3)
  end
end
