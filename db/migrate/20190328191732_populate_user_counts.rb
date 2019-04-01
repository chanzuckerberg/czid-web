class PopulateUserCounts < ActiveRecord::Migration[5.1]
  def up
    User.find_each do |user|
      User.reset_counters(user.id,
                          :samples,
                          :favorite_projects,
                          :favorites,
                          :visualizations,
                          :phylo_trees)
    end
  end
end
