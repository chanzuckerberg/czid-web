class AddLevelToAmrCounts < ActiveRecord::Migration[5.1]
  def change
    add_column :amr_counts, :level, :integer
  end
end
