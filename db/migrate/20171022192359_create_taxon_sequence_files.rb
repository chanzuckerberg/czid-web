class CreateTaxonSequenceFiles < ActiveRecord::Migration[5.1]
  def change
    create_table :taxon_sequence_files do |t|
      t.references :pipeline_output, foreign_key: true
      t.integer :taxid

      t.timestamps
    end
  end
end
