class Project < ApplicationRecord
  if ELASTICSEARCH_ON
    include Elasticsearch::Model
    include Elasticsearch::Model::Callbacks
  end
  include ReportHelper

  has_and_belongs_to_many :users
  has_many :samples, dependent: :restrict_with_exception
  has_many :favorite_projects, dependent: :destroy
  has_many :favorited_by, through: :favorite_projects, source: :user
  has_many :phylo_trees, -> { order(created_at: :desc) }, dependent: :restrict_with_exception
  has_one :background
  has_and_belongs_to_many :metadata_fields

  validates :name, presence: true, uniqueness: { case_sensitive: false }
  # NOTE: not sure why these columns were not created as booleans
  validates :public_access, inclusion: { in: [0, 1] }, if: :mass_validation_enabled?
  # NOTE: all values of background_flag in prod db are currently zero.
  validates :background_flag, inclusion: { in: [0, 1] }, allow_nil: true, if: :mass_validation_enabled?
  # Description requirement added 2020-03-11
  validates :description, presence: true

  before_create :add_default_metadata_fields

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

  def host_gene_counts_tar_filename
    cleaned_project_name + '_host-gene-counts.tar.gz'
  end

  def host_gene_counts_tar_s3(user_id)
    "s3://#{SAMPLES_BUCKET_NAME}/host_gene_count_archives/#{id}/user-#{user_id}/#{host_gene_counts_tar_filename}"
  end

  def host_gene_count_dir(user_id)
    "/app/tmp/host-gene-counts/#{id}/#{user_id}"
  end

  def host_gene_counts_tar(user_id)
    "#{host_gene_count_dir(user_id)}/#{host_gene_counts_tar_filename}"
  end

  def sanitize_path(path)
    return path unless path != File.expand_path(path)
  end

  # Disable samples function. have to go through power
  alias samples_unsafe samples
  def samples
    nil
  end

  def cleaned_project_name
    name.downcase.split(' ').join('_')
  end

  def host_gene_counts_from_params(params)
    user_id = params["user_id"]
    current_power = Power.new(User.find(user_id))
    samples = current_power.project_samples(self)
    output_dir = host_gene_count_dir(user_id)
    work_dir = "#{output_dir}/workdir"
    Syscall.run("rm", "-rf", output_dir)
    Syscall.run("mkdir", "-p", work_dir)
    output_file = host_gene_counts_tar(user_id)
    samples.each do |sample|
      sample_name = "#{sample.name.gsub(/\W/, '-')}_#{sample.id}"
      _stdout, _stderr, status = Open3.capture3("aws", "s3", "ls", "#{sample.sample_host_filter_output_s3_path}/reads_per_gene.star.tab")
      next unless status.exitstatus.zero?
      Syscall.run("aws", "s3", "cp", "#{sample.sample_host_filter_output_s3_path}/reads_per_gene.star.tab", "#{work_dir}/#{sample_name}")
    end
    Syscall.run_in_dir(work_dir, "tar", "cvzf", output_file, ".")
    Syscall.run("aws", "s3", "cp", output_file, host_gene_counts_tar_s3(user_id))
    Syscall.run("rm", "-rf", output_dir)
  end

  def bulk_report_csvs_from_params(params)
    user_id = params["user_id"]
    current_power = Power.new(User.find(user_id))
    user_csv_dir = csv_dir(user_id)
    Syscall.run("rm", "-rf", user_csv_dir)
    Syscall.run("mkdir", "-p", user_csv_dir)
    samples_to_download = current_power.project_samples(self)
    selected_sample_ids = (params["sampleIds"] || "").split(",").map(&:to_i)
    samples_to_download = samples_to_download.where(id: selected_sample_ids) unless selected_sample_ids.empty?
    sample_names_used = []
    samples_to_download.each do |sample|
      csv_data = report_csv_from_params(sample, params)
      clean_sample_name = sample.name.gsub(/\W/, "-")
      used_before = sample_names_used.include? clean_sample_name
      sample_names_used << clean_sample_name
      clean_sample_name += "_#{sample.id}" if used_before
      filename = "#{user_csv_dir}/#{clean_sample_name}.csv"
      File.write(filename, csv_data)
    end
    Syscall.run_in_dir(user_csv_dir, "tar", "cvzf", tar_filename, ".")
    Syscall.run("aws", "s3", "cp", report_tar(user_id), report_tar_s3(user_id))
    Syscall.run("rm", "-rf", user_csv_dir)
  end

  # search is used by ES
  def self.search_by_name(query)
    if query
      tokens = query.scan(/\w+/).map { |t| "%#{t}%" }
      q = scoped
      tokens.each do |token|
        q = q.where("projects.name LIKE :search", search: token.to_s)
      end
      q
    else
      scoped
    end
  end

  def self.editable(user)
    if user.admin?
      all
    else
      where("projects.id in (select project_id from projects_users where user_id=?)", user.id)
    end
  end

  def self.viewable(user)
    if user.admin?
      all
    else
      where("projects.id in (select project_id from projects_users where user_id=?)
             or
             projects.id in (?) ",
            user.id,
            Sample.public_samples.distinct.pluck(:project_id))
    end
  end

  def self.public_projects
    where("projects.id in (?)", Sample.public_samples.distinct.pluck(:project_id))
  end

  def destroy
    samples = Sample.find(sample_ids)
    samples.each(&:destroy)
    super
  end

  def add_default_metadata_fields
    metadata_fields.push(MetadataField.where(is_default: 1) - metadata_fields)
  end
end
