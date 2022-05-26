# Backfills RPM values on TaxonCount
# Will delete this rake task once the values are successfully backfilled
# rake backfill_rpm_values_on_taxon_count

desc "Backfills RPM values on TaxonCount"
task backfill_rpm_values_on_taxon_count: :environment do
  NUM_OF_PIPELINE_RUNS = PipelineRun.count
  BATCH_SIZE = 500.0
  NUM_OF_BATCHES = NUM_OF_PIPELINE_RUNS / 500
  CURRENT_BATCH = 1.0

  failed_taxon_count_updates = []
  puts "Starting to backfill RPM values on TaxonCount"
  PipelineRun.in_batches(of: BATCH_SIZE) do |pipeline_runs|
    pipeline_runs.includes(:taxon_counts).each_with_index do |pr, index|
      pr.taxon_counts.each do |taxon_count|
        taxon_count.update(rpm: pr&.rpm(taxon_count.count))
      rescue StandardError
        puts "Failed to compute or store RPM value for pipeline_run: #{pr.id}, taxon_count: #{taxon_count.id}"
        failed_taxon_count_updates << [taxon_count.id]
      end
      puts "Completed #{index}/#{BATCH_SIZE}. Total percentage complete in batch ##{CURRENT_BATCH} out of #{NUM_OF_BATCHES} batches: #{(index / BATCH_SIZE) * 10}"
    end
    puts "Completed batch ##{CURRENT_BATCH}. Number of batches remaining: #{NUM_OF_BATCHES - CURRENT_BATCH}"
    CURRENT_BATCH += 1.0
  end
  puts "Completed backfilling RPM values on TaxonCount for #{NUM_OF_PIPELINE_RUNS} pipeline runs."
  puts "Total failed taxon count updates: #{failed_taxon_count_updates.count}. IDs of the failed taxon counts: #{failed_taxon_count_updates}"
end
