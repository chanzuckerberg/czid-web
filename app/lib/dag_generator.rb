class DagGenerator
  include ERB::Util
  attr_accessor :template, :host_genome, :attribute_dict

  # http://www.stuartellis.name/articles/erb/
  def initialize(template, project_id, sample_id, host_genome, attribute_dict)
    @project_id = project_id
    @sample_id = sample_id
    @template = template
    @host_genome = host_genome
    @attribute_dict = attribute_dict
  end

  def render
    ERB.new(@template).result(binding)
  end

  def save(file)
    File.open(file, "w+") do |f|
      f.write(render)
    end
  end
end
