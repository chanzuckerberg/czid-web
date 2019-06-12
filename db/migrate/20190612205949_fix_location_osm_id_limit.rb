class FixLocationOsmIdLimit < ActiveRecord::Migration[5.1]
  def up
    # As of now there are 5 billion nodes in OSM (https://wiki.openstreetmap.org/wiki/Stats#In_summary) so limit 5 here gives us max 9,223,372,036,854,775,807 (https://gist.github.com/icyleaf/9089250).
    change_column :locations, :osm_id, :integer, limit: 5
  end

  def down
    change_column :locations, :osm_id, :integer, limit: 4
  end
end
