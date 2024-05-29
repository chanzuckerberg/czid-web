# Rerun workflow runs (AMR, CG).
# Wrapping this as an async job allows us to enqueue it to run at a later time.
class RerunWorkflowRuns
  extend InstrumentedJob

  @queue = :rerun

  def self.perform(ids, workflow)
    if WorkflowRun::MNGS_WORKFLOWS.include?(workflow)
      # sample ids
      Rails.logger.info("Rerunning pipeline runs for samples with ids: #{ids} and workflow #{workflow}")
      Sample.find(ids).each do |sample|
        # updating status to rerun will trigger a rerun from on_save check_status callback
        sample.update(status: Sample::STATUS_RERUN)
      end
      Rails.logger.info("Successfully reran pipeline runs for samples with ids: #{ids}")
    else
      # workflow run ids
      Rails.logger.info("Rerunning workflow runs with ids: #{ids} and workflow #{workflow}")
      WorkflowRun.find(ids).each(&:rerun)
      Rails.logger.info("Successfully reran workflow runs with ids: #{ids} and workflow #{workflow}")
    end
  rescue StandardError => e
    LogUtil.log_error(
      "Failed to rerun workflow runs",
      ids: ids,
      workflow: workflow,
      exception: e
    )
    raise e
  end
end
