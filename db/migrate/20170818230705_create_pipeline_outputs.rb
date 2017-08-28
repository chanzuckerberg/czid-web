class CreatePipelineOutputs < ActiveRecord::Migration[5.1]
  def change
    create_table :pipeline_outputs do |t|
      t.belongs_to :sample, foreign_key: true, null: false
      t.integer :total_reads, null: false
      t.integer :remaining_reads, null: false

      t.timestamps
    end
  end
end
