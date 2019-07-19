class ChangeForeignKeysToBigint < ActiveRecord::Migration[5.1]
  def up
    change_column :metadata, :sample_id, :bigint
    change_column :metadata, :location_id, :bigint

    change_column :favorite_projects, :project_id, :bigint
    change_column :favorite_projects, :user_id, :bigint
  end

  def down
    change_column :metadata, :sample_id, :integer
    change_column :metadata, :location_id, :integer

    change_column :favorite_projects, :project_id, :integer
    change_column :favorite_projects, :user_id, :integer
  end
end
