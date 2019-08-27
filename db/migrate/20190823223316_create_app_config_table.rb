class CreateAppConfigTable < ActiveRecord::Migration[5.1]
  def change
    create_table :app_configs do |t|
      # Global flags that can be used to configure prod on the fly.
      t.string :key
      t.string :value
    end

    add_index :app_configs, :key, unique: true
  end
end
