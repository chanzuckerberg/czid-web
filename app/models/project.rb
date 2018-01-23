class Project < ApplicationRecord
  has_and_belongs_to_many :users
  has_many :samples
  has_many :favorite_projects
  has_many :favorited_by, through: :favorite_projects, source: :user
  validates :name, presence: true, uniqueness: true

  include ReportHelper

  def csv_dir
    path = "/app/tmp/report_csvs/#{id}/#{name}"
    sanitize_path(path)
  end

  def tar_filename
    "#{name.gsub(/\W/, '-')}_reports.tar.gz"
  end

  def report_tar
    path = "#{csv_dir}/#{tar_filename}"
    sanitize_path(path)
  end

  def sanitize_path(path)
    return path unless path != File.expand_path(path)
  end

  def make_bulk_csv(params)
    bulk_report_csvs_from_params(self, params)
  end
end
