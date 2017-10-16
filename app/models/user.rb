class User < ApplicationRecord
  acts_as_token_authenticatable
  # Include default devise modules. Others available are:
  # :confirmable, :lockable, :timeoutable and :omniauthable, :registerable
  devise :database_authenticatable, :recoverable,
         :rememberable, :trackable, :validatable
  has_and_belongs_to_many :projects
  ROLE_ADMIN = 1

  def as_json(_options = {})
    super(methods: [:is_admin])
  end
  def is_admin
    role == ROLE_ADMIN
  end
end
