class FavoriteProject < ApplicationRecord
  belongs_to :project
  belongs_to :user, counter_cache: true # count for analytics
end
