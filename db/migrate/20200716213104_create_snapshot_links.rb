class CreateSnapshotLinks < ActiveRecord::Migration[5.2]
  def change
    create_table :snapshot_links do |t|
      t.references :project, foreign_key: true
      t.text :content, null: false, comment: "Content stored as {samples: [<sample_id>: {pipeline_run_id: <pipeline_run_id>}]}"
      t.string :share_id, limit: 20, null: false, unique: true, comment: "Used for accessing the SnapshotLink URL"
      t.bigint :creator_id, comment: "The user_id that created the snapshot."

      t.index :share_id, unique: true

      t.timestamps
    end
  end
end
