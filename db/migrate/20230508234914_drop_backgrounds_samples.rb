class DropBackgroundsSamples < ActiveRecord::Migration[6.1]
  def change
    drop_join_table(:backgrounds, :samples)
  end
end
