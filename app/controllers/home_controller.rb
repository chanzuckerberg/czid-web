class HomeController < ApplicationController
  def home
    @users = User.all
    @projects = Project.all
    @samples = Sample.all
    @pipeline_outputs = PipelineOutput.order("created_at DESC")
  end
end
