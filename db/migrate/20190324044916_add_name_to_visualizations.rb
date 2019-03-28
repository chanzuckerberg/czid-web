class AddNameToVisualizations < ActiveRecord::Migration[5.1]
  def change
    add_column :visualizations, :name, :string
  end
end
