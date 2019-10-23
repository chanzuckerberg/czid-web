class ChangeTaxonLineageColumns < ActiveRecord::Migration[5.1]
  def change
    change_column :taxon_lineages, :version_start, :integer, null: false, limit: 2, default: nil
    change_column :taxon_lineages, :version_end, :integer, null: false, limit: 2, default: nil
  end
end
