Immigrant.ignore_keys = [
  # Too big
  { from_table: 'taxon_byteranges', column: 'pipeline_run_id' },
  { from_table: 'taxon_counts', column: 'pipeline_run_id' },
  { from_table: 'contigs', column: 'pipeline_run_id' },
  { from_table: 'ercc_counts', column: 'pipeline_run_id' },
  { from_table: 'taxon_summaries', column: 'background_id' },

  # Optional assocs
  { from_table: 'backgrounds', column: 'project_id' },
  { from_table: 'metadata', column: 'location_id' },
  { from_table: 'locations', column: 'city_id' },
  { from_table: 'locations', column: 'country_id' },
  { from_table: 'locations', column: 'state_id' },
  { from_table: 'locations', column: 'subdivision_id' }
]
