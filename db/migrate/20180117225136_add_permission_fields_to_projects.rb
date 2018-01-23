class AddPermissionFieldsToProjects < ActiveRecord::Migration[5.1]
  def change
    add_column :projects, :public_access, :tinyint
    add_column :projects, :days_to_keep_sample_private, :integer
  end
end
