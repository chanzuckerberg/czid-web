### Expected layout in a model

Use this ordering, if you can, for everything at the top of the model files and then the function definitions. This doesn't mean you should have everything below, just the ordering if you have them.

```ruby
class User < ActiveRecord::Base
  # extend and include go first
  extend SomeModule
  include AnotherModule

  # inner classes
  CustomError = Class.new(StandardError)

  # constants are next
  COLORS = %w(red green blue)

  # afterwards we put public attribute related macros
  attr_accessor :formatted_date_of_birth
  attr_accessible :login, :first_name, :last_name, :email, :password

  # enums after attr macros
  enum role: { user: 0, moderator: 1, admin: 2 }

  # followed by association macros
  belongs_to :country
  has_many :authentications, dependent: :destroy

  # and validation macros
  validates :email, presence: true
  validates :username, presence: true
  validates :username, uniqueness: { case_sensitive: false }
  validates :username, format: { with: /\A[A-Za-z][A-Za-z0-9._-]{2,19}\z/ }
  validates :password, format: { with: /\A\S{8,128}\z/, allow_nil: true }

  # next we have callbacks
  before_save :cook
  before_save :update_username_lower
  before_action :check_for_maintenance

  # other macros should be placed after the callbacks

  # then we have public delegate macros
  delegate :to_s, to: :name

  # Named scopes
  scope :user_type, ->(user_type) { where(user_type: user_type) }

  # public class methods are next in line
  def self.some_method
  end

  # followed by other public instance methods
  def some_method
  end

  # private attribute macros, delegate macros and methods
  # are grouped at the bottom
  private

  attr_reader :private_name

  delegate :some_private_delegate, to: :name

  def some_private_method
  end
end
```

Inspired by:
- https://rails.rubystyle.guide/#macro-style-methods
- https://www.rubydoc.info/gems/rubocop/RuboCop/Cop/Layout/ClassStructure
