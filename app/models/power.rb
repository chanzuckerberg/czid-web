class Power
  include Consul::Power

  def initialize(user)
    @user = user
  end

  power :projects do
    Project.viewable(@user)
  end

  power :updatable_projects do
    Project.editable(@user)
  end

  power :destroyable_projects do
    Project.editable(@user)
  end

  power :samples do
    Sample.viewable(@user)
  end

  power :updatable_samples do
    Sample.editable(@user)
  end

  power :destroyable_samples do
    Sample.editable(@user)
  end

  power :project_samples do |project|
    Sample.viewable(@user).where(project_id: project.id)
  end

  power :updatable_project_samples do |project|
    Sample.editable(@user).where(project_id: project.id)
  end
end
