class UpdateLineageVersionAlignmentConfig < ActiveRecord::Migration[6.1]
  def up
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
      t.remove :lineage_version
      t.rename :lineage_version_new, :lineage_version
    end
  end

  def down
    change_table :alignment_configs do |t|
      t.remove :lineage_version
      t.rename :lineage_version_old, :lineage_version
    end
  end
end
