class Project < ApplicationRecord
  has_and_belongs_to_many :users
  has_many :samples
  has_many :favorite_projects
  has_many :favorited_by, through: :favorite_projects, source: :user
  validates :name, presence: true, uniqueness: true
  include ReportHelper

  def csv_dir(user_id)
    path = "/app/tmp/report_csvs/#{id}/#{user_id}"
    sanitize_path(path)
  end

  def tar_filename
    "#{name.downcase.gsub(/\W/, '-')}_reports.tar.gz"
  end

  def report_tar(user_id)
    path = "#{csv_dir(user_id)}/#{tar_filename}"
    sanitize_path(path)
  end

  def report_tar_s3(user_id)
    "s3://#{SAMPLES_BUCKET_NAME}/project_report_archives/#{id}/user-#{user_id}/#{tar_filename}"
  end

  def sanitize_path(path)
    return path unless path != File.expand_path(path)
  end

  def samples
    # Disable samples function. have to go through power
    return nil
  end

  def self.editable(user)
    if user.admin?
      all
    else
      where("id in (select project_id from projects_users where user_id=?)", user.id)
    end
  end

  def self.viewable(user)
    if user.admin?
      all
    else
      where("id in (select project_id from projects_users where user_id=?)
             or
             id in (?) ",
             user.id,
             Sample.public_samples.select("project_id, count(1)")
                   .group("project_id")
                   .pluck(:project_id)
           )
    end
  end

  def self.public_projects
    where("id in (?)",
          Sample.public_samples.select("project_id, count(1)")
                .group("project_id")
                .pluck(:project_id)
         )
  end

end
