class RenameTextValidatedValueField < ActiveRecord::Migration[5.1]
  def up
    rename_column :metadata, :text_validated_value, :string_validated_value
  end
  
  def down
    rename_column :metadata, :string_validated_value, :text_validated_value
  end
end
