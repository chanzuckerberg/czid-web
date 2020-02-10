class ChangeAppConfigValueToText < ActiveRecord::Migration[5.1]
  def change
    change_column :app_configs, :value, :text
  end
end
