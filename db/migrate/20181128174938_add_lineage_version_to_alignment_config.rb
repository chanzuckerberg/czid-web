class AddLineageVersionToAlignmentConfig < ActiveRecord::Migration[5.1]
  def up
    # Max 32767
    add_column :alignment_configs, :lineage_version, :integer, limit: 2
    AlignmentConfig.where(name: "2018-02-15").update(lineage_version: 1)
    AlignmentConfig.where(name: "2018-04-01").update(lineage_version: 2)

    # It will go from alignment lineage_version to "lineage records with a [version_start, version_end] range that includes that number."
    # Current version_end values basically:
    # 0, ended 2018-04-18
    # 1, ended 2018-07-23
    # 2, current
    # AlignmentConfig 2018-04-01 is our current one so it gets lineage_version = 2. AlignmentConfig 2018-02-15 gets lineage_version = 1.
    # Every pipeline run has one of these AlignmentConfigs assigned already (no nil ones).
    # Old records that have version_end == 0 will not be used / would have be succeeded by new records.
    # 
    # We use the lineage_version to figure out which lineage records to use in our pipeline run. Lineage records are highly duplicated 
    # between versions, so instead of storing all of them, we store a [version_start, version_end] range with each lineage record.
    # When the index is updated, if a lineage record is still valid, its version_end gets += 1. Otherwise it stays the same and has been replaced.
  end

  def down
    remove_column :alignment_configs, :lineage_version
  end
end
