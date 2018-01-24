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

  def can_see_project(project)
    project.users.include? self || project.public_access == 1
  end

  def can_see_sample(sample)
    project = sample.project
    return true if project.public_access == 1
    if days_to_keep_sample_private
      days_since_creation = (Time.current - sample.created_at).to_i / 1.day
      return (days_since_creation > days_to_keep_sample_private)
    end
    false
  end
end
