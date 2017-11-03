class User < ApplicationRecord
  acts_as_token_authenticatable
  # Include default devise modules. Others available are:
  # :confirmable, :lockable, :timeoutable and :omniauthable, :registerable
  devise :database_authenticatable, :recoverable,
         :rememberable, :trackable, :validatable
  has_and_belongs_to_many :projects
  has_many :samples
  ROLE_ADMIN = 1

  def as_json(_options = {})
    super(methods: [:admin])
  end

  def admin
    role == ROLE_ADMIN
  end
end
