def missing_children(model)
  assocs = model.reflect_on_all_associations(:has_many)
  model.order(created_at: :desc).limit(LIMIT).map do |obj|
    assocs_data = assocs.map { |assoc| [obj.id, assoc.name, obj.send(assoc.name).pluck(:id)] }
    assocs_data.select { |data| data.last.empty? }
  end
end

def missing_parents(model)
  assocs = model.reflect_on_all_associations(:belongs_to)
  model.order(created_at: :desc).limit(LIMIT).map do |obj|
    assocs_data = assocs.map { |assoc| [obj.id, assoc.name, obj.send(assoc.name)] }
    assocs_data.select { |data| data.last.nil? }
  end
end

def get_initial(assoc_type=:has_many)
  models = ApplicationRecord.descendants
  models.map {|m| [m.name, m.reflect_on_all_associations(assoc_type).map {|a| a.name}]}.select { |p| p[1].length >0 }
end

def must_have_children
  [
       ['AlignmentConfig', [:pipeline_runs]],
       ['HostGenome', [:samples]],
       ['MetadataField', [:metadata]],
       ['PipelineRun', [
          :pipeline_run_stages,
          :output_states,
          :taxon_counts,
          :job_stats,
          :taxon_byteranges,
          :ercc_counts,
          :amr_counts,
          :contigs
       ]],
       # ['User', %i[samples favorite_projects favorites visualizations phylo_trees]],
       ['Background', [:taxon_summaries]],
       ['Project', [
          :samples, 
          :favorite_projects, 
          :favorited_by, 
          :phylo_trees
       ]],
       ['Sample', [
          :pipeline_runs,
          :input_files,
          :metadata
       ]]
    ]
end

def must_have_parents
  [
    ['PipelineRunStage', [:pipeline_run]],
         ['AmrCount', [:pipeline_run]],
         ['InputFile', [:sample]],
         ['OutputState', [:pipeline_run]],
         ['PipelineRun', %i[sample alignment_config]],
         ['TaxonCount', [:pipeline_run]],
         ['Background', [:project]],
         ['Contig', [:pipeline_run]],
         ['ErccCount', [:pipeline_run]],
         ['FavoriteProject', %i[project user]],
         ['JobStat', [:pipeline_run]],
         # ['Location', %i[country state subdivision city]],
         # ['Metadatum', %i[sample metadata_field location]],
         ['PhyloTree', %i[user project]],
         ['Sample', %i[project user host_genome]],
         ['TaxonByterange', [:pipeline_run]],
         ['TaxonSummary', [:background]],
         ['Visualization', [:user]]
  ]
end

# TODO: (gdingle): better limit
LIMIT = 100

task "find_objects_missing_children" => :environment do

  must_have_children.each do |model| 
    missing = missing_parents model 
    puts "#{model.name} has missing parents in objects #{missing}"
  end

end

task "find_objects_missing_parents" => :environment do

  must_have_parents.each do |model| 
    missing = missing_parents model 
    puts "#{model.name} has missing parents in objects #{missing}"
  end

end
