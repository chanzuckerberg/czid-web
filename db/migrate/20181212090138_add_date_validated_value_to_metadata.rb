class AddDateValidatedValueToMetadata < ActiveRecord::Migration[5.1]
  def up
    add_column :metadata, :date_validated_value, :date
    Metadatum.where("`key` LIKE '%_date'").map do |m| 
      m.update(date_validated_value: Date.parse(m.raw_value), text_validated_value: nil, data_type: "date") 
    end
  end

  def down
    Metadatum.where(data_type: "date").map do |m| 
      m.update(text_validated_value: m.raw_value, data_type: "string") 
    end
    remove_column :metadata, :date_validated_value
  end
end
