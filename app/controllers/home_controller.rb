class HomeController < ApplicationController
 before_action :set_project, only: [:show, :edit, :update, :destroy]

 def index
    @users = User.all
    @projects = Project.all
    @samples = Sample.all
    @pipeline_outputs = PipelineOutput.all
  end
end
