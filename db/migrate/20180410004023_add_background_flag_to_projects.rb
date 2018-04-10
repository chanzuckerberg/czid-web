class AddBackgroundFlagToProjects < ActiveRecord::Migration[5.1]
  def change
    add_column :projects, :background_flag, :tinyint
  end
end
