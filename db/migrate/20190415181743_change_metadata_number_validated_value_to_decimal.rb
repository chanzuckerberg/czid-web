class ChangeMetadataNumberValidatedValueToDecimal < ActiveRecord::Migration[5.1]
  def up
    change_column :metadata, :number_validated_value, :decimal, precision: 36, scale: 9
  end

  def down
    change_column :metadata, :number_validated_value, :float, limit: 24
  end
end
