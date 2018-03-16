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

  def can_delete?(user)
    current_power = Power.new(user)
    return false unless current_power.updatable_projects.include?(self)
    non_empty_sample_count = current_power.project_samples(self).select { |s| s.status != Sample::STATUS_CREATED }.count
    non_empty_sample_count == 0
  end

  def samples
    # Disable samples function. have to go through power
    nil
  end

  def bulk_report_csvs_from_params(params)
    user_id = params["user_id"]
    current_power = Power.new(User.find(user_id))
    user_csv_dir = csv_dir(user_id)
    `rm -rf #{user_csv_dir}; mkdir -p #{user_csv_dir}`
    sample_names_used = []
    current_power.project_samples(self).each do |sample|
      csv_data = report_csv_from_params(sample, params)
      clean_sample_name = sample.name.downcase.gsub(/\W/, "-")
      used_before = sample_names_used.include? clean_sample_name
      sample_names_used << clean_sample_name
      clean_sample_name += "_#{sample.id}" if used_before
      filename = "#{user_csv_dir}/#{clean_sample_name}.csv"
      File.write(filename, csv_data)
    end
    `cd #{user_csv_dir}; tar cvzf #{tar_filename} .`
    `aws s3 cp #{report_tar(user_id)} #{report_tar_s3(user_id)}`
    `rm -rf #{user_csv_dir}`
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
                  .pluck(:project_id))
    end
  end

  def self.public_projects
    where("id in (?)",
          Sample.public_samples.select("project_id, count(1)")
                .group("project_id")
                .pluck(:project_id))
  end
end
