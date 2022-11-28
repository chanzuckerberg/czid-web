# Tasks to start a load test by uploading multiple samples from S3.
# Before running the script:
#   * upload to s3:
#     - all fastq/a files for the samples that you wan to include in your test.
#     - a csv file (named metadata.csv) containing all necessary metadata file following IDseq's metadata instructions
#       (template availble at https://idseq.net/metadata/metadata_template_csv)
#   * create a project
#   (ATTENTION: samples not referenced on the csv script will be ignored)
# The script will upload number_test_samples/number_available_samples +- 1 for each sample in round robin fashion.
# Usage:
#    rake "load_test:start[<total_samples>,<s3_bucket>,<s3_samples_path>,<project_name>,<user_id>]"
#    e.g. rake "load_test:start[100,idseq-samples-development,load_test_samples,load-test-project,<user_id>]"
#
# TODO:
# * This is currently enforcing SFN runs. Should move that option to a parameter.
# * Use a specific user to run these tests
# * Move parameters to a config file for more flexibility and clarity.

namespace "load_test" do
  def parse_samples_from_s3_path(s3, s3_bucket, s3_prefix)
    # Some parts were adapted from samples_helper::parsed_samples_for_s3_path
    # It is hard to import our helpers here given all the dependencies - also not a best practice
    resp = s3.list_objects_v2(
      bucket: s3_bucket,
      prefix: s3_prefix,
      max_keys: 100
    )
    samples = {}
    resp.contents.each do |object|
      filename = File.basename(object.key)
      if (match = InputFile::BULK_FILE_PAIRED_REGEX.match(filename))
        name = match[1]
        read_idx = match[2].to_i - 1
      elsif (match = InputFile::BULK_FILE_SINGLE_REGEX.match(filename))
        name = match[1]
        read_idx = 0
      else
        next
      end

      samples[name] ||= {
        name: name,
        input_files_attributes: [],
      }
      samples[name][:input_files_attributes][read_idx] = {
        name: filename,
        source: "s3://#{s3_bucket}/#{object.key}",
        source_type: InputFile::SOURCE_TYPE_S3,
        upload_client: InputFile::UPLOAD_CLIENT_INTERNAL,
      }
    end
    return samples
  end

  desc "start a load test with <total_samples> samples select round-robin fashion from <samples_path>"
  task :start, [:total_samples, :s3_bucket, :samples_path, :project_name, :user_id] => :environment do |_, args|
    Rails.logger = Logger.new(STDOUT)

    Rails.logger.info("Starting a load test in #{Rails.env}")
    Rails.logger.info("Args: #{args}")

    begin
      total_samples = Integer(args.total_samples)
    rescue StandardError
      Rails.logger.error("Total samples is not an integer: #{args.total_samples}.")
      abort("Load test failed")
    end

    user = User.find_by(id: args.user_id)
    unless user
      Rails.logger.error("Please specify an admin user.")
      abort("Load test failed")
    end
    unless user.admin?
      Rails.logger.error("Please specify an admin user. User was: name='#{user.name}' admin=#{user.admin?}")
      abort("Load test failed")
    end

    project = Project.find_by(name: args.project_name)
    unless !project || Sample.where(project: project).empty?
      Rails.logger.error("Please specify a nonexistent or empty project. Project '#{project.name}' has samples.")
      abort("Load test failed")
    end

    # Load metadata.csv
    s3 = Aws::S3::Client.new
    metadata_file_path = File.join(args.samples_path, "metadata.csv")
    begin
      resp_metadata = s3.get_object(
        bucket: args.s3_bucket,
        key: metadata_file_path
      )
      metadata_samples = CSV.parse(resp_metadata.body.read, headers: true).map(&:to_h)
    rescue Aws::S3::Errors::NoSuchKey
      Rails.logger.error("Metadata file not found [bucket=#{args.s3_bucket} path=#{metadata_file_path}]")
      abort("Load test failed")
    end

    # Load samples
    s3_samples = parse_samples_from_s3_path(s3, args.s3_bucket, args.samples_path)

    valid_samples = []
    metadata_samples.each do |sample|
      sample_name = sample["Sample Name"]
      sample_host_name = sample["Host Organism"]
      host = HostGenome.find_by(name: sample_host_name)
      unless s3_samples.include?(sample_name)
        Rails.logger.info("Sample skipped! reason: invalid host '#{sample_host_name}' (sample name=#{name})")
        next
      end
      unless host
        Rails.logger.info("Sample skipped! reason: sample not found (sample name=#{name})")
        next
      end

      valid_samples << {
        attributes: s3_samples[sample_name].merge(project_id: args.project_id,
                                                  host_genome_id: host.id,
                                                  status: 'created'),
        metadata: sample,
      }
    end

    project = Project.find_by(name: args.project_name)
    if project
      Rails.logger.info("Samples will be added to '#{args.project_name}'.")
    else
      Rails.logger.info("Project '#{args.project_name}' will be created.")
    end

    Rails.logger.info("#{total_samples} samples will be created by replicating the following samples:")
    valid_samples.each do |sample|
      Rails.logger.info("\t#{sample[:attributes][:name]}")
    end

    puts "Do you want to continue? (yes/NO)"
    input = STDIN.gets.strip
    unless input == "yes"
      Rails.logger.error("Load test aborted by user")
      abort
    end

    project ||= Project.create(
      name: args.project_name,
      description: "Project used for load testing the pipeline",
      days_to_keep_sample_private: ProjectsController::DEFAULT_DAYS_TO_KEEP_SAMPLE_PRIVATE,
      users: [user]
    )

    samples_to_create = []
    (0...total_samples).each do |i|
      rr_idx = i % valid_samples.size
      sample_attributes = valid_samples[rr_idx][:attributes].clone
      sample_attributes[:name] = "#{sample_attributes[:name]}_#{(i + 1).to_s.rjust(args.total_samples.to_s.size, '0')}"

      Rails.logger.info("Preparing sample '#{sample_attributes[:name]}'")
      sample = Sample.new(sample_attributes)
      sample.input_files.each { |f| f.name ||= File.basename(f.source) }
      sample.bulk_mode = true
      sample.status = Sample::STATUS_CREATED
      sample.user = user
      sample.project = project
      sample.pipeline_execution_strategy = PipelineRun.pipeline_execution_strategies[:step_function]

      # add metadata
      metadata_keys = [
        # used as index
        "Sample Name",
        # process separately
        "Host Organism",
        # Skip due to issues with processing it as a correct location (not relevant for admin load tests)
        "Collection Location",
      ]
      valid_samples[rr_idx][:metadata].each do |key, value|
        # skip
        if metadata_keys.include?(key)
          next
        end

        result = sample.get_metadatum_to_save(key, value)
        if result[:status] == "error" || !result[:metadatum].valid?
          Rails.logger.error("Failed to add metadata: key=#{key} value=#{value}")
          abort("Load test failed")
        end
        sample.metadata << result[:metadatum]
      end

      samples_to_create << sample
    end

    cnt = 0
    samples_to_create.each do |sample_to_create|
      Rails.logger.info("Creating sample '#{sample_to_create.name}'")
      begin
        sample_to_create.save!
      rescue StandardError
        Rails.logger.error("Failed to save sample: #{sample_to_create.name}")
        if cnt
          abort("Load test failed. [ATTENTION] Some samples might have gone through.")
        else
          abort("Load test failed.")
        end
      end
      cnt += 1
    end
  end
end
