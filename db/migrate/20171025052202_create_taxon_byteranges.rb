class CreateTaxonByteranges < ActiveRecord::Migration[5.1]
  def change
    create_table :taxon_byteranges do |t|
      t.integer :taxid
      t.bigint :first_byte
      t.bigint :last_byte
      t.references :pipeline_output, foreign_key: true

      t.timestamps
    end
  end
end
