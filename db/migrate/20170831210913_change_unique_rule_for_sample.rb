class ChangeUniqueRuleForSample < ActiveRecord::Migration[5.1]
  def change
    remove_index :samples, name: "index_samples_on_name"
    remove_index :samples, name: "index_samples_on_project_id"
    add_index :samples, [:project_id, :name], unique: true, name: "index_samples_name_project_id"
  end
end
