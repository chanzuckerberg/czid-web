# ------------------------------------------------------------------------------
# Goal: Copy samples to a new project
#
# How to use:
#   1. Run `rake copy_samples['<project_name>']`.
#   2. On prompt copy/paste a CSV with the following fields "Source Project Name, Source Sample Name, Sample Name Source"
#      Extra fields will be discarded.
#      Make sure to end on a new line and press CTRL+D.
#   3. Verify changes described and the desired changes
#   4. Type 'yes' if you which to continue
#
# Notes:
#   * The copy of all S3 files for a sample might take some time (there does not seem to exist
#     a recursive copy for the AWS Ruby SDK, or for sync command, at the moment).
#   * You might want to consider copying the S3 files yourself using `aws s3 sync`
#   * The task duplicates samples, pipeline runs and all results but keeps same user and stage configurations.
# ------------------------------------------------------------------------------

require "aws-sdk-s3"

class ActiveRecord::Base
  cattr_accessor :skip_callbacks
end
ActiveRecord::Base.skip_callbacks = true

DEFAULT_S3_REGION = "us-west-2".freeze

def read_input
  STDIN.binmode
  tmp_file = Tempfile.new('copy_samples_file')
  tmp_file.write(STDIN.read)
  tmp_file.close

  yield tmp_file.path

  tmp_file.unlink
end

def duplicate_sample(old_sample, target_project, new_sample_fields)
  new_sample = duplicate_sample_db(old_sample, target_project, new_sample_fields)
  duplicate_sample_s3(old_sample, new_sample)
end

def duplicate_sample_db(old_sample, target_project, new_sample_fields)
  puts "Duplicating sample: #{old_sample.name} => #{new_sample_fields['Sample Name']}"
  puts "\t- Deep DB copy..."

  # using: https://github.com/moiristo/deep_cloneable
  duplicate_sample = old_sample.deep_clone include: [:metadata, :input_files] do |original, copy|
    # Not ideal, but we keep original creation timestamp as it is used to infer uploading timestamp
    copy.created_at = original.created_at
  end
  puts "\t- Setting sample name to #{new_sample_fields['Sample Name']}"
  duplicate_sample.name = new_sample_fields['Sample Name']
  puts "\t- Setting project to #{target_project.name}"
  duplicate_sample.project = target_project

  # set input files to local to make sure we do not trigger s3 copy
  puts "\t- Setting input files source to #{InputFile::SOURCE_TYPE_LOCAL}"
  duplicate_sample.input_files.each do |input_file|
    input_file.source_type = InputFile::SOURCE_TYPE_LOCAL
  end

  if duplicate_sample.valid?
    duplicate_sample.save
    puts "\t- Saved sample: #{duplicate_sample.id}"
  else
    puts "\t- Invalid sample when duplicating: #{duplicate_sample.name}"
    raise InvalidDuplicateSampleError, "Invalid sample: #{duplicate_sample}"
  end

  old_sample.pipeline_runs.to_a.sort_by(&:id).each do |pr|
    puts "\t- Copying pipeline run: #{pr.id}"
    new_pr = pr.deep_clone include: [
      :taxon_counts,
      :job_stats,
      :output_states,
      :taxon_byteranges,
      :ercc_counts,
      :amr_counts,
      :contigs,
      :pipeline_run_stages,
    ] do |original, copy|
      copy.created_at = original.created_at
    end
    new_pr.sample_id = duplicate_sample.id
    new_pr.save
  end

  return duplicate_sample
rescue StandardError => e
  puts "\t[ERROR] Failed to create sample: #{e.message}"
  # stop at the first error
  raise e
end

def duplicate_sample_s3(old_sample, new_sample)
  s3 = Aws::S3::Client.new(region: DEFAULT_S3_REGION)

  puts "\t- S3 files copy..."
  source_prefix = "samples/#{old_sample.project_id}/#{old_sample.id}"
  target_prefix = "samples/#{new_sample.project_id}/#{new_sample.id}"

  begin
    resp = s3.list_objects_v2(bucket: SAMPLES_BUCKET_NAME, prefix: source_prefix)
    resp[:contents].each do |object|
      source_key = object[:key]
      target_key = object[:key].dup.gsub(source_prefix, target_prefix)
      puts "\t\t* Copying #{SAMPLES_BUCKET_NAME}/#{source_key} -> #{SAMPLES_BUCKET_NAME}/#{target_key} ..."
      s3.copy_object(bucket: SAMPLES_BUCKET_NAME, copy_source: "#{SAMPLES_BUCKET_NAME}/#{source_key}", key: target_key)
    end
  rescue StandardError => e
    puts "\t\t[ERROR] Exception copying #{SAMPLES_BUCKET_NAME}/#{source_prefix} -> #{SAMPLES_BUCKET_NAME}/#{target_prefix}"
    puts "\t\t[ERROR] Please copy manually using 'aws s3 sync s3://#{SAMPLES_BUCKET_NAME}/#{source_prefix} s3://#{SAMPLES_BUCKET_NAME}/#{target_prefix}'"
    raise e
  end
end

task :copy_samples, [:project_name] => :environment do |_, args|
  puts "Environment: #{Rails.env}"
  puts "Please paste you CSV and press CTRL+D in the end:"
  csv_rows = []
  read_input do |filename|
    csv_rows = CSV.read(filename, headers: true)
  end

  # create new project
  project = Project.find_by(name: args[:project_name])

  samples_to_duplicate = []
  samples_duplicated = []
  samples_not_found = []
  csv_rows.each do |row|
    source_sample_name = row["Source Sample Name"]
    # find sample
    sample = Sample.find_by(name: source_sample_name)
    if sample
      new_sample = Sample.find_by(name: row["Sample Name"])
      if new_sample
        samples_duplicated << { old_sample: sample, new_sample: new_sample }
      else
        samples_to_duplicate << { old_sample: sample, new_sample: row }
      end
    else
      samples_not_found << source_sample_name
    end
  end

  if project
    puts "Project '#{project.name}' already exists"
  else
    puts "[CHANGE] Public project '#{args[:project_name]}' will be created"
  end

  unless samples_to_duplicate.empty?
    puts "Samples to copy:"
    samples_to_duplicate.each do |sample|
      puts " - [CHANGE] [#{sample[:old_sample].id}]: #{sample[:old_sample].name} -> #{sample[:new_sample]['Sample Name']}"
    end
  end

  unless samples_duplicated.empty?
    puts "Samples already duplicated (ignored). You might want to check if s3 files are copied:"
    samples_duplicated.each do |sample|
      source_prefix = "samples/#{sample[:old_sample].project_id}/#{sample[:old_sample].id}"
      target_prefix = "samples/#{sample[:new_sample].project_id}/#{sample[:new_sample].id}"

      puts " - [#{sample[:new_sample].id}]: #{sample[:new_sample].name}. To sync s3: 'aws s3 sync s3://#{SAMPLES_BUCKET_NAME}/#{source_prefix} s3://#{SAMPLES_BUCKET_NAME}/#{target_prefix}' "
      puts
    end
  end

  unless samples_not_found.empty?
    puts "Samples not found (ignored):"
    samples_not_found.each do |sample_name|
      puts " - #{sample_name}"
    end
  end

  puts "Do you want to continue? (yes/NO)"
  input = STDIN.gets.strip
  if input == "yes"
    if project.blank?
      project = Project.create(
        name: args[:project_name],
        public_access: 1
      )
    end

    samples_to_duplicate.each do |sample_info|
      duplicate_sample(sample_info[:old_sample], project, sample_info[:new_sample])
    end
    puts "Copy finished: #{samples_to_duplicate.count} samples copied."

  else
    puts "Stopped - Did not make any changes!"
  end
end
