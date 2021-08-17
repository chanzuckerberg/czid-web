# LOGGING: This runs within shoryuken. To find logs, go to the latest ecs-log-{env} -> idseq-shoryuken/idseq-shoryuken/* log streams.

class HandleSfnNotifications
  include Shoryuken::Worker

  STATUS_CHANGE_DETAIL_TYPE ||= "Step Functions Execution Status Change".freeze

  shoryuken_options queue: ENV["SFN_NOTIFICATIONS_QUEUE_ARN"], body_parser: :json

  def perform(sqs_msg, body)
    if body && body["Message"]
      parsed_message = JSON.parse(body["Message"])
      detail_type = parsed_message["detail-type"]

      if detail_type == STATUS_CHANGE_DETAIL_TYPE
        details = parsed_message["detail"]
        arn = details["executionArn"]
        status = details["status"]

        wr = WorkflowRun.find_by(sfn_execution_arn: arn)
        pt = PhyloTreeNg.find_by(sfn_execution_arn: arn)
        if wr
          wr.update_status(status)
          sqs_msg.delete
          Rails.logger.info("Updated WorkflowRun #{wr.id} #{arn} to #{status}")
        elsif pt
          pt.update_status(status)
          sqs_msg.delete
          Rails.logger.info("Updated PhyloTreeNg #{pt.id} #{arn} to #{status}")
        end
      end
    end

    # If the message isn't relevant to us, it automatically goes back to the
    # queue since we don't call sqs_msg.delete.
  rescue StandardError => e
    LogUtil.log_error("Unexpected error in HandleSfnNotifications", exception: e, body: body)
  end
end
