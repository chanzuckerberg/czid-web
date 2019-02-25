class AddPublicAccessToVisualizations < ActiveRecord::Migration[5.1]
  def change
    add_column :visualizations, :public_access, :tinyint
  end
end
