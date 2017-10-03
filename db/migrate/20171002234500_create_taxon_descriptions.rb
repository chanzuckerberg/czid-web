class CreateTaxonDescriptions < ActiveRecord::Migration[5.1]
  def change
    create_table :taxon_descriptions do |t|
      t.bigint :version

      t.timestamps
    end
  end
end
