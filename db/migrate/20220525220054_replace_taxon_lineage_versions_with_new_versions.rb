class ReplaceTaxonLineageVersionsWithNewVersions < ActiveRecord::Migration[6.1]
  def up
    # This is the third phase in a migration to convert version_start and version_end from integers to string dates such as `2022-05-12`
    safety_assured { change_table :taxon_lineages, bulk: true do |t|
      t.remove_index name: "index_taxon_lineages_on_taxid_and_version_start"
      t.remove_index name: "index_taxon_lineages_on_taxid_and_version_start_and_version_end"
      t.remove_index name: "index_taxon_lineages_on_taxid_and_version_end"
      t.remove :version_start
      t.remove :version_end
    end }

    safety_assured { change_table :taxon_lineages, bulk: true do |t|
      t.string :version_start, limit: 10, comment: "The first version for which the lineage is valid"
      t.string :version_end, limit: 10, comment: "The last version for which the lineage is valid"
    end }

    TaxonLineage.connection.execute("
      UPDATE taxon_lineages
      SET version_start = version_start_new,
        version_end = version_end_new
    ")

    safety_assured { change_table :taxon_lineages, bulk: true do |t|
      t.change_null :version_start, false
      t.change_null :version_end, false
      t.index ["taxid", "version_start"], name: "index_taxon_lineages_on_taxid_and_version_start", unique: true
      t.index ["taxid", "version_start", "version_end"], name: "index_taxon_lineages_on_taxid_and_version_start_and_version_end", unique: true
      t.index ["taxid", "version_end"], name: "index_taxon_lineages_on_taxid_and_version_end", unique: true
    end }
  end

  def down
    safety_assured { change_table :taxon_lineages, bulk: true do |t|
      t.remove_index name: "index_taxon_lineages_on_taxid_and_version_start"
      t.remove_index name: "index_taxon_lineages_on_taxid_and_version_start_and_version_end"
      t.remove_index name: "index_taxon_lineages_on_taxid_and_version_end"
      t.remove :version_start
      t.remove :version_end
    end }

    safety_assured { change_table :taxon_lineages, bulk: true do |t|
      t.integer :version_start, limit: 2, comment: "The first version for which the taxon is active"
      t.integer :version_end, limit: 2, comment: "The last version for which the taxon is active"
    end }

    TaxonLineage.connection.execute("
      UPDATE taxon_lineages
        LEFT JOIN alignment_configs
      ON taxon_lineages.version_start_new = alignment_configs.lineage_version
      SET taxon_lineages.version_start = IFNULL(alignment_configs.lineage_version_old, 0);
    ")

    TaxonLineage.connection.execute("
      UPDATE taxon_lineages
        LEFT JOIN alignment_configs
      ON taxon_lineages.version_end_new = alignment_configs.lineage_version
      SET taxon_lineages.version_end = IFNULL(alignment_configs.lineage_version_old, 0);
    ")

    safety_assured { change_table :taxon_lineages, bulk: true do |t|
      t.change_null :version_start, false
      t.change_null :version_end, false
      t.index ["taxid", "version_start"], name: "index_taxon_lineages_on_taxid_and_version_start", unique: true
      t.index ["taxid", "version_start", "version_end"], name: "index_taxon_lineages_on_taxid_and_version_start_and_version_end", unique: true
      t.index ["taxid", "version_end"], name: "index_taxon_lineages_on_taxid_and_version_end", unique: true
    end }
  end
end
