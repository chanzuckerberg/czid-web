class HostGenome < ApplicationRecord
  has_many :samples

  def default_background
    Background.find(default_background_id) if default_background_id
  end
end
