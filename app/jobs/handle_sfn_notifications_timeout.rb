# Logs: This runs within resque. To find the logs, go to ecs-log-{env} ->
# idseq-resque/idseq-resque/* log streams.
#
# See also HandleSfnNotifications. This job is meant as a fail-safe in case we
# never receive or miss a notification.

require './lib/cloudwatch_util'

class HandleSfnNotificationsTimeout
  extend InstrumentedJob

  @queue = :handle_sfn_notifications_timeout

  MAX_RUNTIME ||= 24.hours.freeze

  def self.perform
    Rails.logger.info("Starting HandleSfnNotificationsTimeout job...")

    overdue_workflow_runs = WorkflowRun.where(status: WorkflowRun::STATUS[:running]).where("executed_at < ?", MAX_RUNTIME.ago)
    if overdue_workflow_runs.present?
      overdue_workflow_runs.each do |wr|
        # Alert is sent within update_status:
        wr.update_status(WorkflowRun::STATUS[:failed])
        Rails.logger.info("Marked WorkflowRun #{wr.id} as failed due to timeout.")
      end
    end

    overdue_pipeline_runs = PipelineRun.in_progress.where("executed_at < ?", MAX_RUNTIME.ago)
    if overdue_pipeline_runs.present?
      overdue_pipeline_runs.each do |pr|
        prs = pr.active_stage
        if prs.nil?
          # All stages succeeded.
          pr.finalized = 1
          pr.time_to_finalized = pr.send(:time_since_executed_at)
          pr.job_status = PipelineRun::STATUS_CHECKED
          pr.save
        else
          pr.job_status = PipelineRun::STATUS_FAILED
          pr.finalized = 1
          pr.time_to_finalized = pr.send(:time_since_executed_at)
          pr.known_user_error, pr.error_message = pr.check_for_user_error(prs)
          automatic_restart = pr.automatic_restart_allowed? unless pr.known_user_error
          # Alert is sent within report_failed_pipeline_run_stage:
          pr.send(:report_failed_pipeline_run_stage, prs, pr.known_user_error, automatic_restart)
          pr.save
          pr.monitor_results
          Rails.logger.info("Marked PipelineRun #{pr.id} as failed due to timeout.")
        end
      end
    end

    overdue_trees = PhyloTreeNg.where(status: WorkflowRun::STATUS[:running]).where("executed_at < ?", MAX_RUNTIME.ago)
    if overdue_trees.present?
      overdue_trees.each do |pt|
        # Alert is sent within update_status:
        pt.update_status(WorkflowRun::STATUS[:failed])
        Rails.logger.info("Marked PhyloTreeNg #{pt.id} as failed due to timeout.")
      end
    end

    if overdue_workflow_runs.present? || overdue_pipeline_runs.present? || overdue_trees.present?
      dimensions = [
        { name: "EventName", value: "SfnNotificationsTimeout" },
      ]
      metric_data = [
        CloudWatchUtil.create_metric_datum("Event occurrences", overdue_workflow_runs.size + overdue_pipeline_runs.size + overdue_trees.size, "Count", dimensions),
      ]
      CloudWatchUtil.put_metric_data("#{Rails.env}-sfn-notifications-timeout-count", metric_data)
    end

    return overdue_workflow_runs.size + overdue_pipeline_runs.size + overdue_trees.size
  end
end
