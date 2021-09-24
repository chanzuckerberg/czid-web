class PathogenList < ApplicationRecord
  has_many :pathogen_list_version, dependent: :destroy
end
