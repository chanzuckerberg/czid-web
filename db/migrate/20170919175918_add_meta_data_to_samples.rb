class AddMetaDataToSamples < ActiveRecord::Migration[5.1]
  def change
    add_column :samples, :sample_host, :string
    add_column :samples, :sample_location, :string
    add_column :samples, :sample_date, :string
    add_column :samples, :sample_tissue, :string
    add_column :samples, :sample_template, :string
    add_column :samples, :sample_library, :string
    add_column :samples, :sample_sequencer, :string
    add_column :samples, :sample_notes, :text
  end
end
