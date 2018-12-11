module PhyloTreeHelper
  include SamplesHelper

  def sample_details_by_tree_id
    query_results = ActiveRecord::Base.connection.select_all("
      select phylo_tree_id, pipeline_run_id, ncbi_metadata, sample_id, samples.*, projects.name as project_name, host_genomes.name as host_genome_name
      from phylo_trees, phylo_trees_pipeline_runs, pipeline_runs, host_genomes, samples
      inner join projects on samples.project_id = projects.id
      where phylo_trees.id = phylo_trees_pipeline_runs.phylo_tree_id and
            phylo_trees_pipeline_runs.pipeline_run_id = pipeline_runs.id and
            pipeline_runs.sample_id = samples.id and
            host_genomes.id = samples.host_genome_id
      order by phylo_tree_id
    ").to_a
    indexed_results = {}
    metadata_by_sample_id = metadata_multiget(query_results.pluck("sample_id").uniq)

    query_results.each do |entry|
      tree_id = entry["phylo_tree_id"]
      pipeline_run_id = entry["pipeline_run_id"]
      tree_node_name = pipeline_run_id.to_s
      entry["metadata"] = metadata_by_sample_id[entry["sample_id"]]
      indexed_results[tree_id] ||= {}
      indexed_results[tree_id][tree_node_name] = entry
    end
    # Add NCBI metadata
    query_results.index_by { |entry| entry["phylo_tree_id"] }.each do |tree_id, tree_data|
      ncbi_metadata = JSON.parse(tree_data["ncbi_metadata"] || "{}")
      ncbi_metadata.each do |node_id, node_metadata|
        node_metadata["name"] ||= node_metadata["accession"]
        indexed_results[tree_id][node_id] = node_metadata
      end
    end
    indexed_results
  end
end
