class Project < ApplicationRecord
  has_and_belongs_to_many :users
  has_many :samples
  has_many :favorite_projects
  has_many :favorited_by, through: :favorite_projects, source: :user
  validates :name, presence: true, uniqueness: true

  def csv_dir
    path = "/app/tmp/report_csvs/#{id}/#{name}"
    sanitize_path(path)
  end

  def report_tar
    path = "#{csv_dir}/#{name}_reports.tar.gz"
    sanitize_path(path)
  end

  def sanitize_path(path)
    return path unless path != File.expand_path(path)
  end
end
