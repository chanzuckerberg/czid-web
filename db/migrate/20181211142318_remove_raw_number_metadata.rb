class RemoveRawNumberMetadata < ActiveRecord::Migration[5.1]
  def up
    Metadatum.where(data_type: "number").update_all("text_raw_value=number_raw_value")
    rename_column :metadata, :text_raw_value, :raw_value
    remove_column :metadata, :number_raw_value
  end

  def down
    add_column :metadata, :number_raw_value, :float
    rename_column :metadata, :raw_value, :text_raw_value
    Metadatum.where(data_type: "number").update_all("number_raw_value=text_raw_value")
  end
end
