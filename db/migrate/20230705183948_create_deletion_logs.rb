class CreateDeletionLogs < ActiveRecord::Migration[6.1]
  def change
    create_table :deletion_logs do |t|
      t.bigint :object_id, null: false, comment: "The id of the object that was deleted"
      t.bigint :user_id, null: false, comment: "The user id of the user who deleted the object"
      t.string :user_email, comment: "The email of the user who deleted the object"
      t.string :object_type, null: false, comment: "The type of object deleted, e.g. PipelineRun"
      t.datetime :soft_deleted_at, comment: "When the object was marked as soft deleted"
      t.datetime :hard_deleted_at, comment: "When the object was successfully hard deleted"
      t.string :metadata_json, comment: "Generic JSON-string format for recording additional information about the object"

      t.timestamps
    end
  end
end
