class UiConfig < ApplicationRecord
  validates :min_nt_z, presence: true
  validates :min_nr_z, presence: true
  validates :min_nt_rpm, presence: true
  validates :min_nr_rpm, presence: true
  validates :top_n, presence: true

  after_initialize :set_default_values

  def set_default_values
    self.min_nt_z ||= 1
    self.min_nr_z ||= 1
    self.min_nt_rpm ||= 1
    self.min_nr_rpm ||= 1
    self.top_n ||= 3
  end
end
