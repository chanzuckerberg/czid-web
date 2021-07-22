class RenameGroupColumnToSegments < ActiveRecord::Migration[6.1]
  def change
    rename_column :users, :group, :segments
  end
end
