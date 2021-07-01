class DagGenerator
  include ERB::Util
  attr_accessor :template, :host_genome, :attribute_dict

  # http://www.stuartellis.name/articles/erb/
  def initialize(template_file, project_id, sample_id, host_genome, attribute_dict, dag_vars_dict)
    @template_file = template_file

    # Add to attribute_dict values for Jbuilder templates for portability
    attribute_dict[:host_genome] = host_genome
    attribute_dict[:project_id] = project_id
    attribute_dict[:sample_id] = sample_id
    attribute_dict[:rails_env] = Rails.env
    attribute_dict[:dag_vars_dict] = dag_vars_dict

    @attribute_dict = attribute_dict
    @dag_vars_dict = dag_vars_dict
  end

  def render
    rendered = ActionController::Base.render(template: @template_file, locals: { attr: @attribute_dict })
    # Couldn't find a more direct way to prettify from template
    json_object = JSON.parse(rendered)
    JSON.pretty_generate(json_object)
  end

  def save(file)
    File.open(file, "w+") do |f|
      f.write(render)
    end
  end
end
