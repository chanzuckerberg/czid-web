class User < ApplicationRecord
  acts_as_token_authenticatable
  # Include default devise modules. Others available are:
  # :confirmable, :lockable, :timeoutable and :omniauthable, :registerable
  devise :database_authenticatable, :recoverable,
         :rememberable, :trackable, :validatable
  has_and_belongs_to_many :projects
  has_many :samples
  has_many :favorite_projects
  has_many :favorites, through: :favorite_projects, source: :project
  attr_accessor :email_arguments
  ROLE_ADMIN = 1
  DEMO_USER_EMAILS = ['idseq.guest@chanzuckerberg.com'].freeze

  def as_json(options = {})
    super({ except: [:authentication_token], methods: [:admin] }.merge(options))
  end

  def admin
    role == ROLE_ADMIN
  end

  def admin?
    admin
  end

  def demo_user?
    DEMO_USER_EMAILS.include?(email)
  end

  def can_upload(s3_path)
    user_bucket = s3_path.split("/")[2] # get "bucket" from "s3://bucket/path/to/file"
    user_bucket != SAMPLES_BUCKET_NAME || admin?
  end
end
