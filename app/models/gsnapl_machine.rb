class GsnaplMachine < ApplicationRecord
  has_many :gsnapl_runs, dependent: :destroy
end
