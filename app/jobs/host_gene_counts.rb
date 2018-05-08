class HostGeneCounts
  @queue = :q03_pipeline_run
  def self.perform(params)
    project = Project.find(params["id"])
    project.host_gene_counts_from_params(params)
  end
end
