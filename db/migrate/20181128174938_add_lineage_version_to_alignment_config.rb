class AddLineageVersionToAlignmentConfig < ActiveRecord::Migration[5.1]
  def up
    # Max 32767
    add_column :alignment_config, :lineage_version, :integer, limit: 2
    AlignmentConfig.where(name: "2018-02-15").update(lineage_version: 0)
    AlignmentConfig.where(name: "2018-04-01").update(lineage_version: 2)

    # It will go from alignment lineage_version to "lineage records with a [version_start, version_end] range that includes that number."
    # Current version_end values:
    # 0, ended 2018-04-18
    # 1, ended 2018-07-23
    # 2, current
    # AlignmentConfig 2018-04-01 is our current one so it gets lineage_version = 2. Everything earlier than that gets lineage_version = 0.
    # Every pipeline run has one of these AlignmentConfigs assigned already.
  end

  def down
    remove_column :alignment_config, :lineage_version
  end
end
