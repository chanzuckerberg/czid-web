class ChangeColumnTypeArchivedBackgroundData < ActiveRecord::Migration[5.1]
  def change
    change_column :archived_backgrounds, :data, :text
  end
end
