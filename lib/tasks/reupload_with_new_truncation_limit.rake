# Only for use with samples that were uploaded using the "Upload from S3" method
# (and the source files are still at the original location in S3).
# Creates a copy of a sample (sample_id) into a project (project_id)
# with a truncation limit of PipelineRun::DEFAULT_MAX_INPUT_FRAGMENTS times the limit_multiplier. 
# Example: rake "reupload_with_new_truncation_limit[4, 27, 100]"
task :reupload_without_truncation, [:limit_multiplier, :sample_id, :project_id] => :environment do |_t, args|
  sample = Sample.find(args[:sample_id])
  project = Project.find(args[:project_id)
  new_limit = args[:limit_multiplier] * PipelineRun::DEFAULT_MAX_INPUT_FRAGMENTS

  new_sample = sample.deep_clone include: [:metadata, :input_files]
  new_sample.project_id = project.id
  new_sample.max_input_fragments = new_limit
  new_sample.status = Sample::STATUS_CREATED
  new_sample.save!
end
