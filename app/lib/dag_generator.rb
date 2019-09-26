class DagGenerator
  include ERB::Util
  attr_accessor :template, :host_genome, :attribute_dict

  # http://www.stuartellis.name/articles/erb/
  def initialize(template_file, project_id, sample_id, host_genome, attribute_dict, dag_vars_dict)
    @project_id = project_id
    @sample_id = sample_id
    @template = File.open(template_file, "r").read
    @template_file = template_file
    @host_genome = host_genome

    # Add to attribute_dict values for Jbuilder templates
    attribute_dict[:host_genome] = host_genome
    attribute_dict[:project_id] = project_id
    attribute_dict[:sample_id] = sample_id

    @attribute_dict = attribute_dict
    @dag_vars_dict = dag_vars_dict
  end

  def render
    if File.extname(@template_file) == ".jbuilder"
      rendered = ActionController::Base.new.render_to_string(
        file: @template_file,
        :locals => {:attr => @attribute_dict},
      )
      # Couldn't find a more direct way to prettify from template
      json_object = JSON.parse(rendered)
      JSON.pretty_generate(json_object)
    else
      ERB.new(@template).result(binding)
    end
  end

  def save(file)
    File.open(file, "w+") do |f|
      f.write(render)
    end
  end
end
