# Run as `rake launch_human_host_genome_version_2`
# Lauches Human host genome v2 (aka, T2T) by pinning all existing projects to
# Human v1 (aka, HG38) and then making v2 available for general use.
# Expected to only be run once per environment. See CZID-8173 for more info.
desc "Backfill ProjectWorkflowVersion for Human v1, then launch Human v2"
task launch_human_host_genome_version_2: :environment do
  EXPECTED_AVAILABLE_HUMAN_VERSION = 1
  HUMAN_VERSION_TO_RELEASE = 2

  # Start with safety checks: first, ensure currently available Human is v1 and the HG exists.
  latest_available_human_version = WorkflowVersion.latest_version_of(HostGenome::HUMAN_HOST)
  latest_available_human_hg = HostGenome.find_by(name: "Human", version: latest_available_human_version)
  if latest_available_human_hg.version != EXPECTED_AVAILABLE_HUMAN_VERSION
    puts "WARNING! Your DB does not have the expected state for Human HostGenome versions."
    puts "latest_available_human_version=#{latest_available_human_version}"
    puts "latest_available_human_hg=#{latest_available_human_hg.inspect}"
    puts "Exiting and doing nothing. Please inspect WorkflowVersions and HostGenomes."
    raise "Abandoning due to unexpected DB state around Human v1"
  end
  # Additional safety check that Human v2 is an existing HG so we can release it later.
  if HostGenome.find_by(name: "Human", version: HUMAN_VERSION_TO_RELEASE).nil?
    puts "WARNING! Your DB does not have a HostGenome of Human version 2."
    puts "Exiting and doing nothing. Please inspect HostGenomes."
    raise "Abandoning due to Human v2 not existing in DB"
  end

  BATCH_SIZE = 1000
  puts "Pinning human host version #{latest_available_human_version} in batches of #{BATCH_SIZE}."
  puts "Total count of projects in DB: #{Project.count}"
  current_batch = 0
  Project.in_batches(of: BATCH_SIZE) do |projects|
    projects.each do |project|
      VersionPinningService.call(
        project.id,
        HostGenome::HUMAN_HOST,
        latest_available_human_version
      )
    end
    current_batch += 1
    puts "Pinned human version for the projects in batch #{current_batch}"
    sleep 1 # Throttle DB interaction because working in bulk
  end
  puts "All projects now have human version pinned."

  puts "Making Human v2 available for general use."
  WorkflowVersion.create(
    workflow: HostGenome::HUMAN_HOST,
    version: HUMAN_VERSION_TO_RELEASE,
    deprecated: false,
    runnable: true
  )
  puts "Completed launching Human v2!"
end
