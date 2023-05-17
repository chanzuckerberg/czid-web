class DropTableArchivedBackground < ActiveRecord::Migration[6.1]
  def up
    drop_table :archived_backgrounds
  end

  def down
    raise ActiveRecord::IrreversibleMigration
  end
end
