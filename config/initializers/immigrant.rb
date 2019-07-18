Immigrant.ignore_keys = [
  # Too big
  { from_table: 'taxon_byteranges', column: 'pipeline_run_id' },
  { from_table: 'taxon_counts', column: 'pipeline_run_id' },
  { from_table: 'contigs', column: 'pipeline_run_id' },

  # Optional assocs
  { from_table: 'backgrounds', column: 'project_id' },
  { from_table: 'metadata', column: 'location_id' },
  { from_table: 'locations', column: 'city_id' },
  { from_table: 'locations', column: 'country_id' },
  { from_table: 'locations', column: 'state_id' },
  { from_table: 'locations', column: 'subdivision_id' },

  # Many to many
  { from_table: 'backgrounds_pipeline_runs', column: 'background_id' },
  { from_table: 'backgrounds_pipeline_runs', column: 'pipeline_run_id' },
  { from_table: 'backgrounds_samples', column: 'background_id' },
  { from_table: 'backgrounds_samples', column: 'sample_id' },
  { from_table: 'host_genomes_metadata_fields', column: 'host_genome_id' },
  { from_table: 'host_genomes_metadata_fields', column: 'metadata_field_id' },
  { from_table: 'metadata_fields_projects', column: 'metadata_field_id' },
  { from_table: 'metadata_fields_projects', column: 'project_id' },
  { from_table: 'phylo_trees_pipeline_runs', column: 'phylo_tree_id' },
  { from_table: 'phylo_trees_pipeline_runs', column: 'pipeline_run_id' },
  { from_table: 'projects_users', column: 'project_id' },
  { from_table: 'projects_users', column: 'user_id' },
  { from_table: 'samples_visualizations', column: 'sample_id' },
  { from_table: 'samples_visualizations', column: 'visualization_id' }
]
