class AddDateValidatedValueToMetadata < ActiveRecord::Migration[5.1]
  def change
    add_column :metadata, :date_validated_value, :date
  end
end
