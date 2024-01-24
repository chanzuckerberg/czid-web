# Run as `rake backfill_pin_index_version_to_projects`
# Pins current default alignment config to all projects
desc "Backfill ProjectWorkflowVersion for NCBI index version"
task backfill_pin_index_version_to_projects: :environment do
  batch_size = 1000

  puts("Pinning index version to version #{AlignmentConfig.default_name} in batches of #{batch_size}.")
  current_batch = 0
  Project.in_batches(of: batch_size) do |projects|
    projects.each(&:pin_default_alignment_config)
    current_batch += 1
    puts("Pinned index version for projects in batch #{current_batch}")
  end
end
