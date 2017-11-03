class AddTypeToInputFile < ActiveRecord::Migration[5.1]
  def change
    add_column :input_files, :type, :string
  end
end
