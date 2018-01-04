class AddArchiveOfToBackground < ActiveRecord::Migration[5.1]
  def change
    add_column :backgrounds, :archive_of, :bigint
  end
end
