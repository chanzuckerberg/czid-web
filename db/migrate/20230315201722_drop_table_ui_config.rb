class DropTableUiConfig < ActiveRecord::Migration[6.1]
  def up
    drop_table :ui_configs
  end

  def down
    raise ActiveRecord::IrreversibleMigration
  end
end
