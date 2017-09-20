class HomeController < ApplicationController
  def home
    @users = User.all
    @projects = Project.all
    @samples = Sample.all
    @pipeline_outputs = PipelineOutput.all
  end
end
