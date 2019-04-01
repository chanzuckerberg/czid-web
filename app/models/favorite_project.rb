class FavoriteProject < ApplicationRecord
  belongs_to :project
  belongs_to :user, counter_cache: true # use .size for cache, use .count to force COUNT query
end
