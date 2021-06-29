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

    overdue_runs = WorkflowRun.where(status: WorkflowRun::STATUS[:running]).where("executed_at < ?", MAX_RUNTIME.ago)
    if overdue_runs.present?
      overdue_runs.each do |wr|
        # Alert is sent within update_status:
        wr.update_status(WorkflowRun::STATUS[:failed])
        Rails.logger.info("Marked WorkflowRun #{wr.id} as failed due to timeout.")
      end

      dimensions = [
        { name: "EventName", value: "SfnNotificationsTimeout" },
      ]
      metric_data = [
        CloudWatchUtil.create_metric_datum("Event occurrences", overdue_runs.size, "Count", dimensions),
      ]
      CloudWatchUtil.put_metric_data("#{Rails.env}-sfn-notifications-timeout-count", metric_data)
    end

    return overdue_runs.size
  end
end
