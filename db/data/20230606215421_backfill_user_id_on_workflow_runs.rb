# frozen_string_literal: true

class BackfillUserIdOnWorkflowRuns < ActiveRecord::Migration[6.1]
  def up
    batch_size = 500
    wrs = WorkflowRun.non_deleted
    num_wrs = wrs.count
    num_batches = num_wrs/batch_size
    current_batch = 0

    puts "Starting to backfill `user_id` on workflow_runs"
    puts "Total batches being processed: #{num_batches}. Total number of workflow_runs per batch: #{batch_size}"

    wrs.in_batches(of: batch_size) do |workflow_runs|
      workflow_runs.includes(sample: :user).each do |workflow_run|
        sample_owner = workflow_run&.sample&.user
        if sample_owner && workflow_run.user_id.nil?
          workflow_run.update(user_id: sample_owner.id)
        else
          puts "Skipping backfill for workflow_run #{workflow_run.id} because sample owner is nil or workflow_run.user_id is already set"
        end
      end

      puts "\t--------- Finished batch #{current_batch} out of #{num_batches} ---------"
      current_batch += 1
    end
    puts "Successfully backfilled `user_id` on all workflow_runs"
  end

  def down
    raise ActiveRecord::IrreversibleMigration
  end
end
