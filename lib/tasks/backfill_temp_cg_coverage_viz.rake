desc "Backfills the temp_cg_coverage_viz column on the WorkflowRuns table"

# rake backfill_temp_cg_coverage_viz
# To run in a Rails console: Rails.application.load_tasks
# Rake::Task['backfill_temp_cg_coverage_viz'].invoke
task backfill_temp_cg_coverage_viz: :environment do
  wrs = WorkflowRun.consensus_genomes.where(temp_cg_coverage_viz: nil, status: WorkflowRun::STATUS[:succeeded])
  puts "Backfilling temp_cg_coverage_viz for #{wrs.count} workflow runs"

  batches = wrs.in_batches # 1000 wrs per batch
  puts "Processing #{batches.count} batches of workflow runs"

  batches.each_with_index do |batch, batch_index|
    batch.each do |wr|
      metrics = ConsensusGenomeCoverageService.call(workflow_run: wr, cacheable_only: false)
      wr.update!(temp_cg_coverage_viz: metrics) if metrics.present?
      puts "Updated temp_cg_coverage_viz for workflow run #{wr.id}"

      sleep(0.3) # Sleep for 0.3 seconds per workflow run to avoid rate limiting
    rescue SfnExecution::SfnDescriptionNotFoundError, ConsensusGenomeCoverageService::NoDepthDataError
      puts "No depth data for workflow run #{wr.id}"
      wr.update!(temp_cg_coverage_viz: {})
    end
    puts "Processed batch #{batch_index}"
  end
  puts "Completed backfilling temp_cg_coverage_viz for all successful consensus genome workflow runs"
end
