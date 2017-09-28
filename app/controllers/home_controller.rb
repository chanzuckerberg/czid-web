class HomeController < ApplicationController
  def home
    @users = User.all
    @projects = Project.all
    @samples = Sample.all
    @output_data = Hash.new

    @pipeline_outputs = PipelineOutput.order("created_at DESC")

    @pipeline_outputs.each do | output |
      sample_info =  output.sample
      project_info = output.sample.project
      @output_data['sample_info'] = sample_info
      @output_data['project_info'] = project_info
    end
    
  end
end
