class ChangeBackgroundFlagDefault < ActiveRecord::Migration[5.1]
  def change
    change_column :projects, :background_flag, :tinyint, default: 0
  end
end
