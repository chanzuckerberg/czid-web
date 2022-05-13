class AddNewTaxidLineageColumns < ActiveRecord::Migration[6.1]
  def up
    # This is the first phase in a migration to convert version_start and version_end from integers to string dates such as `2022-05-12`
    change_table :taxon_lineages, bulk: true do |t|
      # Create columns for the new string dates
      t.string :version_start_new, limit: 10, comment: "The first version for which the lineage is valid"
      t.string :version_end_new, limit: 10, comment: "The last version for which the lineage is valid"
      t.boolean :is_phage, null: false, default: false
    end

    TaxonLineage.connection.execute("
      UPDATE taxon_lineages
        LEFT JOIN alignment_configs
      ON taxon_lineages.version_start = alignment_configs.lineage_version
      SET taxon_lineages.version_start_new = IFNULL(alignment_configs.name, '2020-01-15');
    ")

    TaxonLineage.connection.execute("
      UPDATE taxon_lineages
        LEFT JOIN alignment_configs
      ON taxon_lineages.version_end = alignment_configs.lineage_version
      SET taxon_lineages.version_end_new = IFNULL(alignment_configs.name, '2020-01-15');
    ")

    change_table :taxon_lineages, bulk: true do |t|
      t.change_null :version_start_new, false
      t.change_null :version_end_new, false
      t.index ["taxid", "version_start_new"], name: "index_taxon_lineages_on_taxid_and_version_start_new", unique: true
      t.index ["taxid", "version_start_new", "version_end_new"], name: "index_taxon_lineages_on_taxid_and_versions_new", unique: true
      t.index ["taxid", "version_end_new"], name: "index_taxon_lineages_on_taxid_and_version_end_new", unique: true
    end

    phage_families = TaxonLineage::PHAGE_FAMILIES_TAXIDS.join(",")
    TaxonLineage.connection.execute("
      UPDATE taxon_lineages
      SET taxon_lineages.is_phage = 1
      WHERE family_taxid IN (#{phage_families})
    ")
    phage_taxids = TaxonLineage::PHAGE_TAXIDS.join(",")
    TaxonCount.connection.execute("
      UPDATE taxon_lineages
      SET taxon_lineages.is_phage = 1
      WHERE taxid IN (#{phage_taxids})
    ")
  end

  def down
    change_table :taxon_lineages, bulk: true do |t|
      t.remove_index name: "index_taxon_lineages_on_taxid_and_version_start_new"
      t.remove_index name: "index_taxon_lineages_on_taxid_and_versions_new"
      t.remove_index name: "index_taxon_lineages_on_taxid_and_version_end_new"
      t.remove :version_start_new
      t.remove :version_end_new
      t.remove :is_phage
    end
  end
end
