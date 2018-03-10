class AddPartsToInputFiles < ActiveRecord::Migration[5.1]
  def change
    add_column :input_files, :parts, :text
  end
end
