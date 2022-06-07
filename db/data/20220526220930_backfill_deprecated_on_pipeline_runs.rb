class BackfillDeprecatedOnPipelineRuns < ActiveRecord::Migration[6.1]
  disable_ddl_transaction!

  def set_sample_pipeline_runs_deprecated(sample)
    # If the sample has more than one pipeline run, set deprecated to true for all other pipeline runs except the first.
    # Pipeline Runs are sorted by created_at: desc by default when accessing a sample's pipeline runs via `sample.pipeline_runs`
    sample.pipeline_runs.each_with_index do |pr, index|
      pr.update(deprecated: true) if index != 0
    end
  end

  def up
    num_samples = Sample.count
    batch_size = 500
    num_batches = num_samples/batch_size
    current_batch = 0

    puts "Starting to backfill the deprecated column on PipelineRun"
    puts "Total batches being processed: #{num_batches}. Total number of samples per batch: #{batch_size}"
    Sample.unscoped.in_batches(of: batch_size) do |samples|
      # The last batch will have probably not have 500 samples so I count the number of samples in the batch here
      size_of_current_batch = samples.count
      samples.includes(:pipeline_runs).each_with_index do |sample, sample_index|
        set_sample_pipeline_runs_deprecated(sample)
        puts "Percent complete in batch #{current_batch}: #{((sample_index + 1)/(size_of_current_batch < 1 ? 1 : size_of_current_batch).to_f) * 100}"
      end

      puts "\t--------- Finished batch #{current_batch} out of #{num_batches} ---------"
      current_batch += 1
    end
    puts "Successfully backfilled `deprecated` on all PipelineRuns"
  end

  def down
    raise ActiveRecord::IrreversibleMigration
  end
end
