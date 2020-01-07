class RemoveMetadataFromSample < ActiveRecord::Migration[5.1]
  def change
    change_table :samples, bulk: true do |t|
      t.remove :sample_unique_id, :sample_location, :sample_date, :sample_tissue
      t.remove :sample_template, :sample_library, :sample_sequencer, :sample_input_pg
      t.remove :sample_batch, :sample_diagnosis, :sample_organism, :sample_detection
    end
  end
end
