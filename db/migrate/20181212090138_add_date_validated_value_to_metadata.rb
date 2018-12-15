class AddDateValidatedValueToMetadata < ActiveRecord::Migration[5.1]
  def up
    unless column_exists? :metadata, :string_validated_value
      rename_column :metadata, :text_validated_value, :string_validated_value
    end

    unless column_exists? :metadata, :date_validated_value
      add_column :metadata, :date_validated_value, :date
    end
    Metadatum.where("`key` LIKE '%_date'").map do |m|
      begin
        m.update(date_validated_value: Date.parse(m.raw_value), string_validated_value: nil, data_type: "date")
      rescue
        m.update(string_validated_value: nil, data_type: "date")
      end
    end
  end

  def down
    unless column_exists? :metadata, :text_validated_value
      rename_column :metadata, :string_validated_value, :text_validated_value
    end

    Metadatum.where(data_type: "date").map do |m|
      m.update(text_validated_value: m.raw_value, data_type: "string")
    end
    remove_column :metadata, :date_validated_value
  end
end
