class Power
  include Consul::Power

  def initialize(user)
    @user = user
  end

  power :users do
    User if @user.admin
  end

end
