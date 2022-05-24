class AddCreatedAtIndices < ActiveRecord::Migration[6.1]
  def up
    add_index :samples, :created_at
    add_index :workflow_runs, :created_at
    add_index :projects, :created_at
  end
end
