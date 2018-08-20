class AmrCount < ApplicationRecord
  belongs_to :pipeline_run
  def self.viewable(user)
    if user.admin?
      all
    end
  end

  def self.editable(user)
    if user.admin?
      all
    end
  end
end
