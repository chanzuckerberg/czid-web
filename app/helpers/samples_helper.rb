module SamplesHelper
  def host_genomes_list
    HostGenome.all.map { |h| [h.name, h.id] }
  end
end
