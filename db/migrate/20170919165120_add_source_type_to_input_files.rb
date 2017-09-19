class AddSourceTypeToInputFiles < ActiveRecord::Migration[5.1]
  def change
    add_column :input_files, :source_type, :string, null: false
  end
end
