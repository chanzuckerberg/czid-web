class HomeController < ApplicationController
  def home
    @output_data = {}
    @pipeline_outputs = PipelineOutput.order("created_at DESC").paginate(page: params[:page], per_page: 6)

    @pipeline_outputs.each do |output|
      sample_info =  output.sample
      project_info = output.sample.project
      @output_data['sample_info'] = sample_info
      @output_data['project_info'] = project_info
    end
  end
end
