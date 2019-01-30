require 'elasticsearch/model'

class User < ApplicationRecord
  unless Rails.env == 'test'
    include Elasticsearch::Model
    include Elasticsearch::Model::Callbacks
  end
  acts_as_token_authenticatable
  # Include default devise modules. Others available are:
  # :confirmable, :lockable, :timeoutable and :omniauthable, :registerable
  devise :database_authenticatable, :recoverable,
         :rememberable, :trackable, :validatable
  has_and_belongs_to_many :projects
  has_many :samples
  has_many :favorite_projects
  has_many :favorites, through: :favorite_projects, source: :project
  validates :email, presence: true
  validates :name, presence: true, format: { with: /\A[a-zA-Z -]+\z/, message: "only allows letters" }
  attr_accessor :email_arguments
  ROLE_ADMIN = 1
  DEMO_USER_EMAILS = ['idseq.guest@chanzuckerberg.com'].freeze
  IDSEQ_BUCKET_PREFIXES = ['idseq-'].freeze
  CZBIOHUB_BUCKET_PREFIXES = ['czb-', 'czbiohub-'].freeze

  def as_json(options = {})
    super({ except: [:authentication_token], methods: [:admin] }.merge(options))
  end

  def admin
    role == ROLE_ADMIN
  end

  def admin?
    admin
  end

  def allowed_feature_list
    JSON.parse(allowed_features || "[]")
  end

  def demo_user?
    DEMO_USER_EMAILS.include?(email)
  end

  def can_upload(s3_path)
    return true if admin?

    user_bucket = s3_path.split("/")[2] # get "bucket" from "s3://bucket/path/to/file"

    # Don't allow any users to upload from idseq buckets
    return false if user_bucket == SAMPLES_BUCKET_NAME || IDSEQ_BUCKET_PREFIXES.any? { |prefix| user_bucket.downcase.starts_with?(prefix) }

    # Don't allow any non-Biohub users to upload from czbiohub buckets
    if CZBIOHUB_BUCKET_PREFIXES.any? { |prefix| user_bucket.downcase.starts_with?(prefix) }
      unless ["czbiohub.org", "ucsf.edu"].include?(email.split("@").last)
        return false
      end
    end

    true
  end
end
