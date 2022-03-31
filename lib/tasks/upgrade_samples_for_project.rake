desc "Upgrade all samples in a give project to a given pipeline version"
task :upgrade_samples_for_project, [:project_id, :target_version] => :environment do |_t, _args|
  options = {}
  opts = OptionParser.new
  opts.banner = "Usage: bin/rails :upgrade_samples_for_project -- [options]"
  opts.on("-p", "--projectid PROJECTID", Integer) { |project_id| options[:project_id] = project_id }
  opts.on("-v", "--version VERSION", String) { |target_version| options[:target_version] = target_version }

  args = opts.order!(ARGV) {}
  opts.parse!(args)

  # Check that required arguments are provided
  begin
    mandatory = [:project_id, :target_version]
    missing = mandatory.select { |param| options[param].nil? }
    raise OptionParser::MissingArgument, missing.join(', ') unless missing.empty?
  rescue OptionParser::ParseError => e
    puts e
    puts opts
    exit
  end

  project_id = options[:project_id]

  # Used to upgrade any samples that have not been run with this version of pipeline
  # NOTE: As of 03-2022, the query examines the `pipeline_version` column
  # in the `pipeline_runs` table, but note that this column does not include
  # patch versions that can be returned with the following command
  # `AppConfigHelper::get_workflow_version(WorkflowRun::WORKFLOW[<WORKFLOW_OPTION>])`
  # where WORKFLOW_OPTION in [:main, :consensus_genome, :short_read_mngs]
  current_pipeline_version = options[:target_version]

  # This script has been run successfully on hundreds of samples, but if
  # particular samples take too long to process, this could lead to pipeline
  # errors. In that situation, the commands in this script can be run manually
  # in a shell or individual attribution instance.
  samples = Sample.includes(:pipeline_runs).where(project_id: project_id).select do |s|
    most_recent_pipeline_run_version = s.pipeline_runs&.last&.pipeline_version
    most_recent_pipeline_run_version && most_recent_pipeline_run_version != current_pipeline_version
  end

  puts "Upgrading #{samples.count} samples in project #{project_id}"

  samples.each.with_index do |s, i|
    version = s.pipeline_runs.last.pipeline_version
    puts "#{i} - Kicking off pipeline for sample #{s.id} - #{s.name} from v#{version} to v#{current_pipeline_version}"
    s.kickoff_pipeline
    sleep 1 # space out pipeline kickoffs
  end

  exit
end
