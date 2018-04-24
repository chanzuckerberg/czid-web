class AddMoreMetadata < ActiveRecord::Migration[5.1]
  def change
    add_column :samples, :sample_input_pg, :float
    add_column :samples, :sample_batch, :integer
    add_column :samples, :sample_diagnosis, :text
    add_column :samples, :sample_organism, :string
    add_column :samples, :sample_detection, :string
  end
end
