class AddTaxonLineageColumns < ActiveRecord::Migration[5.1]
  def up
    add_column :taxon_lineages, :tax_name, :string
    add_index :taxon_lineages, :tax_name
    # Limit = 1 byte for max 255
    add_column :taxon_lineages, :version_start, :integer, limit: 1
    add_column :taxon_lineages, :version_end, :integer, limit: 1

    TaxonLineage.all.each do |lin|
      # For each lineage entry, find the first positive tax level (species->genus->...)
      # and set the corresponding name.
      (1..8).each do |level_int|
        level_str = TaxonCount::LEVEL_2_NAME[level_int]
        if lin["#{level_str}_taxid"] > 0
          new_name = lin["#{level_str}_name"]
          lin.update(name: new_name)
        end
      end
    end

    # Set started_at
    start_vals = TaxonLineage.distinct.pluck(:started_at).sort
    start_vals.each_with_index do |t, i|
      TaxonLineage.where(started_at: t).update_all(version_start: i) # rubocop:disable Rails/SkipsModelValidations
    end

    # Set ended_at
    end_vals = TaxonLineage.distinct.pluck(:ended_at).sort
    end_vals.each_with_index do |t, i|
      TaxonLineage.where(ended_at: t).update_all(version_end: i) # rubocop:disable Rails/SkipsModelValidations
    end
  end

  def down
    remove_index :taxon_lineages, :tax_name
    remove_column :taxon_lineages, :tax_name
    remove_column :taxon_lineages, :version_start
    remove_column :taxon_lineages, :version_end
  end
end
