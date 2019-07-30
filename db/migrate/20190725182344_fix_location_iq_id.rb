class FixLocationIqId < ActiveRecord::Migration[5.1]
  def up
    # Limit 5 here gives us max 9,223,372,036,854,775,807 (https://gist.github.com/icyleaf/9089250).
    change_column :locations, :locationiq_id, :integer, limit: 5
  end

  def down
    change_column :locations, :locationiq_id, :integer, limit: 4
  end
end
