class Power
  include Consul::Power

  def initialize(user)
    @user = user
  end

  power :users do
    User if @user.admin?
  end

  power :viewable_projects do
    Project.viewable(@user)
  end

  power :editable_projects do
    Project.editable(@user)
  end

  power :viewable_samples do |project|
    if project
      project.samples.viewable(@user)
    else
      Sample.viewable(@user)
    end
  end

  power :editable_samples do |project|
    if project
      project.samples.editable(@user)
    else
      Sample.editable(@user)
    end
  end

end
