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
  ROLE_ADMIN = 1

  def as_json(options = {})
    super({ except: [:authentication_token], methods: [:admin] }.merge(options))
  end

  def admin
    role == ROLE_ADMIN
  end

  def admin?
    admin
  end

  def can_see_project(proj)
    visible_projects.include? proj
  end

  def can_see_sample(sample)
    visible_samples.include? sample
  end

  def visible_projects
    Project.where(public_access: 1) | projects
  end

  def days_since_creation(sample)
    (Time.current - sample.created_at).to_i / 1.day
  end

  def visible_samples
    public_samples = Project.where(public_access: 1).samples
    expired_private_samples = Sample.all.select { |s| days_since_creation(s) > s.days_to_keep_sample_private }
    public_samples | expired_private_samples
  end
end
