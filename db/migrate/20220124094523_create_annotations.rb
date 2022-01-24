class CreateAnnotations < ActiveRecord::Migration[6.1]
  def change
    create_table :annotations do |t|
      t.bigint :pipeline_run_id, null: false, comment: "The pipeline run id associated with the annotated sample report."
      t.integer :tax_id, null: false, comment: "The id of the annotated taxon."
      t.integer :content, comment: "An enum describing the annotation content. Will be set to null if an existing annotation is cleared."
      t.bigint :creator_id, comment: "The id of the user that created the annotation."

      t.index [:pipeline_run_id, :tax_id]

      t.timestamps
    end
  end
end
