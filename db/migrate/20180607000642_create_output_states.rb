class CreateOutputStates < ActiveRecord::Migration[5.1]
  def change
    create_table :output_states do |t|
      t.string :output
      t.string :state
      t.bigint :pipeline_run_id

      t.timestamps
    end

    add_index :output_states, [:pipeline_run_id, :output], unique: true
  end
end
