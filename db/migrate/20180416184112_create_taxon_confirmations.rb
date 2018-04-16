class CreateTaxonConfirmations < ActiveRecord::Migration[5.1]
  def change
    create_table :taxon_confirmations do |t|
      t.integer :taxon_lineage_id
      t.integer :sample_id
      t.integer :user_id
      t.string :type # "watched" or "confirmed"
      t.string :method # e.g. "qPCR"

      t.index [:sample_id, :user_id, :type]
      t.timestamps
    end
  end
end
