class AddEndedAtToTaxonLineages < ActiveRecord::Migration[5.1]
  def change
    add_column :taxon_lineages, :started_at, :datetime, default: DateTime.new(2000), null: false
    add_column :taxon_lineages, :ended_at, :datetime, default: DateTime.new(3000), null: false
  end
end
