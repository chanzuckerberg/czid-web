class PhyloTree < ApplicationRecord
  has_and_belongs_to_many :samples, through: :pipeline_runs
  has_and_belongs_to_many :pipeline_runs
  belongs_to :user
end
