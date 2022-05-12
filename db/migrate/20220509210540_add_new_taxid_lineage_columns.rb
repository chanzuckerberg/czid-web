class AddNewTaxidLineageColumns < ActiveRecord::Migration[6.1]
  def up
    # This is the first phase in a migration to convert version_start and version_end from integers to string dates such as `2022-05-12`
    change_table :taxon_lineages, bulk: true do |t|
      # Create columns for the new string dates
      t.string :version_start_new, null: false, limit: 10, if_not_exists: true, comment: "The first version for which the lineage is valid"
      t.string :version_end_new, null: false, limit: 10, if_not_exists: true, comment: "The last version for which the lineage is valid"
      t.boolean :is_phage, null: false, default: false
      t.index ["taxid", "version_start_new"], name: "index_taxon_lineages_on_taxid_and_version_start_new", unique: true, if_not_exists: true
      t.index ["taxid", "version_start_new", "version_end_new"], name: "index_taxon_lineages_on_taxid_and_versions_new", unique: true, if_not_exists: true
      t.index ["taxid", "version_end_new"], name: "index_taxon_lineages_on_taxid_and_version_end_new", unique: true, if_not_exists: true
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

    change_table :alignment_configs, bulk: true do |t|
      t.integer :lineage_version_old, limit: 2
      t.string :lineage_version_new, null: false, limit: 10
    end

    AlignmentConfig.connection.execute("
      UPDATE alignment_configs
      SET lineage_version_old = lineage_version,
        lineage_version_new = name
    ")

    change_table :alignment_configs do |t|
      t.remove :lineage_version, limit: 2
      t.rename :lineage_version_new, :lineage_version
    end
  end

  def down
    change_table :taxon_lineages, bulk: true do |t|
      t.remove_index name: "index_taxon_lineages_on_taxid_and_version_start_new", if_exists: true
      t.remove_index name: "index_taxon_lineages_on_taxid_and_versions_new", if_exists: true
      t.remove_index name: "index_taxon_lineages_on_taxid_and_version_end_new", if_exists: true
      t.remove :version_start_new, if_exists: true
      t.remove :version_end_new, if_exists: true
      t.remove :is_phage
    end

    change_table :alignment_configs do |t|
      t.remove :lineage_version
      t.rename :lineage_version_old, :lineage_version
    end
  end
end
