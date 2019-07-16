
desc "Finds database records that are missing child records"

task "find_records_missing_children", [:max_per_model] => :environment do |t, args|
  ActiveRecord::Base.logger.level = :info
  args.with_defaults(:max_per_model => 1000)
  must_have_children.each do |model_name, assocs| 
    puts "\nFinding #{model_name} records that are missing child records by has_many assocs #{assocs} ..."
    model = all_models[model_name.to_s]
    missing = missing_children(model, assocs, args.max_per_model)
    if missing.length > 0 
      puts "Model #{model.name} has missing children in records: #{JSON.pretty_generate(missing)}"
    end
    puts get_total_message(args.max_per_model, model)
  end
end

desc "Finds database records that are missing parent records"

task "find_records_missing_parents", [:max_per_model] => :environment do |t, args|
  ActiveRecord::Base.logger.level = :info
  args.with_defaults(:max_per_model => 1000)
  must_have_parents.each do |model_name, assocs| 
    puts "\nFinding #{model_name} records that are missing a parent record by belongs_to assocs #{assocs} ..."
    model = all_models[model_name.to_s]
    missing = missing_parents(model, assocs, args.max_per_model)
    if missing.length > 0
      puts "Model #{model.name} has missing parents in records: #{JSON.pretty_generate(missing)}"
    end
    puts get_total_message(args.max_per_model, model)
  end
end

private 

def missing_children(model, assocs, max_per_model)
  format_missing(model.order(created_at: :desc).limit(max_per_model).map do |record|
    assocs
      .map { |assoc| [record.id, assoc, record.send(assoc).pluck(:id)] }
      .select { |data| data.last.empty? }
      .map { |data| [data[0], data[1]] }
  end)
end

def missing_parents(model, assocs, max_per_model)
  format_missing(model.order(created_at: :desc).limit(max_per_model).map do |record|
    assocs
      .map { |assoc| [record.id, assoc, record.send(assoc)] }
      .select { |data| data.last.nil? }
      .map { |data| [data[0], data[1]] }
  end)
end

def format_missing(missing)
  missing
  .select {|m| m.length > 0}
  .flatten(1)
  .group_by{|m| m[0]}
  .map { |k, v| [k, v.map { |e| e[1] }] }
  .to_h
end

# Run this in the rails console
def get_initial(assoc_type=:has_many)
  models = ApplicationRecord.descendants
  models.map {|m| [m.name, m.reflect_on_all_associations(assoc_type).map {|a| a.name}]}
    .select { |p| p[1].length >0 }
    .to_h
end

# Data first obtained by get_initial(:has_many)
def must_have_children
  {
    :AlignmentConfig => [:pipeline_runs],
    :HostGenome => [:samples],
    :MetadataField => [:metadata],
    :PipelineRun => [
       :pipeline_run_stages,
       :output_states,
       # :taxon_counts,
       :job_stats,
       # :taxon_byteranges,
       # :ercc_counts,
       # :amr_counts,
       # :contigs
    ],
    # :User => %i[samples favorite_projects favorites visualizations phylo_trees],
    :Background => [:taxon_summaries],
    :Project => [
       # need to use unsafe method to keep with access control
       :samples_unsafe, 
       # :samples, 
       # :favorite_projects, 
       # :favorited_by, 
       # :phylo_trees
    ],
    :Sample => [
       :pipeline_runs,
       :input_files,
       # :metadata
    ]
  }
end

# Data first obtained by get_initial(:belongs_to)
def must_have_parents
  {
    :PipelineRunStage => [:pipeline_run],
    :AmrCount => [:pipeline_run],
    :InputFile => [:sample],
    :OutputState => [:pipeline_run],
    :PipelineRun => %i[sample alignment_config],
    :TaxonCount => [:pipeline_run],
    :Background => [:project],
    :Contig => [:pipeline_run],
    :ErccCount => [:pipeline_run],
    :FavoriteProject => %i[project user],
    :JobStat => [:pipeline_run],
    # :Location => %i[country state subdivision city],
    # :Metadatum => %i[sample metadata_field location],
    :PhyloTree => %i[user project],
    :Sample => %i[project user host_genome],
    :TaxonByterange => [:pipeline_run],
    :TaxonSummary => [:background],
    :Visualization => [:user]
  }
end

def all_models
  Rails.application.eager_load!
  ApplicationRecord.descendants.map {|m| [m.name, m]}.to_h
end

def get_total_message(max_per_model, model)
  puts "Finished checking #{max_per_model} most recent records out of #{model.count} in the database."
end