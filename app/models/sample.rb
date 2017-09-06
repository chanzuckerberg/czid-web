class Sample < ApplicationRecord
  belongs_to :project
  has_many :pipeline_outputs, dependent: :destroy
  has_and_belongs_to_many :backgrounds
end
