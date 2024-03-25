class CreateNextGenDeletionLogs < ActiveRecord::Migration[6.1]
  def change
    create_table :nextgen_deletion_logs do |t|
      t.bigint :user_id, null: false, comment: "The user id of the user who deleted the object"
      t.string :user_email, comment: "The email of the user who deleted the object"
      t.bigint :rails_object_id, comment: "The id of the object that was deleted (Rails ID)"
      t.string :object_id, null: false, comment: "The id of the object that was deleted (NextGen UUID)"
      t.string :object_type, null: false, comment: "The type of object deleted, e.g. Sample, Workflow"
      t.datetime :soft_deleted_at, comment: "When the object was marked as soft deleted"
      t.datetime :hard_deleted_at, comment: "When the object was successfully hard deleted"
      t.string :metadata_json, comment: "Generic JSON-string format for recording additional information about the object"
      t.timestamps
    end
  end
end
