class HostGenome < ApplicationRecord
  has_many :samples

  NO_HOST_NAME = 'No host subtraction'.freeze

  def default_background
    Background.find(default_background_id) if default_background_id
  end
end
