class AddProjectIdToBackground < ActiveRecord::Migration[5.1]
  def change
    add_column :backgrounds, :project_id, :bigint
  end
end
