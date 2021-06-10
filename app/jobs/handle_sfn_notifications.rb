# LOGGING: This runs within shoryuken. To find logs, go to the latest ecs-log-{env} -> idseq-shoryuken/idseq-shoryuken/* log streams.

class HandleSfnNotifications
  include Shoryuken::Worker

  STATUS_CHANGE_DETAIL_TYPE ||= "Step Functions Execution Status Change".freeze

  shoryuken_options queue: ENV["SFN_NOTIFICATIONS_QUEUE_ARN"], auto_delete: true, body_parser: :json

  def perform(_, contents)
    return unless AppConfigHelper.get_app_config(AppConfig::ENABLE_SFN_NOTIFICATIONS) == "1"

    if contents && contents["Message"]
      parsed_message = JSON.parse(contents["Message"])
      detail_type = parsed_message["detail-type"]

      if detail_type == STATUS_CHANGE_DETAIL_TYPE
        details = parsed_message["detail"]
        arn = details["executionArn"]
        status = details["status"]

        wr = WorkflowRun.find_by(sfn_execution_arn: arn)
        if wr
          wr.update_status(status)
          Rails.logger.info("Updated WorkflowRun #{wr.id} #{arn} to #{status}")
        end
      end
      # TODO: Add more handling for different detail_type or no matching ARN
    end
  end
end
