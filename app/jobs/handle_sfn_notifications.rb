# LOGGING: This runs within shoryuken. To find logs, go to the latest ecs-log-{env} -> idseq-shoryuken/idseq-shoryuken/* log streams.

class HandleSfnNotifications
  include Shoryuken::Worker

  STATUS_CHANGE_DETAIL_TYPE ||= "Step Functions Execution Status Change".freeze

  shoryuken_options queue: ENV["SFN_NOTIFICATIONS_QUEUE_ARN"], body_parser: :json

  def perform(sqs_msg, body)
    return if body.blank?

    parsed_message = body["Message"] ? JSON.parse(body["Message"]) : body
    detail_type = parsed_message["detail-type"]

    if detail_type == STATUS_CHANGE_DETAIL_TYPE
      details = parsed_message["detail"]
      arn = details["executionArn"]
      status = details["status"]

      Rails.logger.info("Looking for run with arn #{arn}")

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

      if AppConfigHelper.get_app_config(AppConfig::ENABLE_SFN_NOTIFICATIONS) == "1"
        pr = PipelineRun.find_by(sfn_execution_arn: arn)
        if pr
          pr.update_job_status
          Rails.logger.info("Updated PipelineRun #{pr.id} #{arn} to #{status}")
          pr.monitor_results
          Rails.logger.info("Monitoring results for PipelineRun #{pr.id} #{arn}")
          sqs_msg.delete
        end
      end

    end

    # If the message isn't relevant to us, it automatically goes back to the
    # queue since we don't call sqs_msg.delete.
  rescue StandardError => e
    LogUtil.log_error("Unexpected error in HandleSfnNotifications", exception: e, body: body)
  end
end
