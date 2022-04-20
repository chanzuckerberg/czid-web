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
      handle_workflow_run_update(arn, sqs_msg, status)
      handle_phylo_tree_ng_update(arn, sqs_msg, status)

      if AppConfigHelper.get_app_config(AppConfig::ENABLE_SFN_NOTIFICATIONS) == "1"
        handle_pipeline_run_update(arn, sqs_msg, details, status)
      end

    end

    # If the message isn't relevant to us, it automatically goes back to the
    # queue since we don't call sqs_msg.delete.
  rescue StandardError => e
    LogUtil.log_error("Unexpected error in HandleSfnNotifications", exception: e, body: body)
  end

  def handle_workflow_run_update(arn, sqs_msg, status)
    wr = WorkflowRun.find_by(sfn_execution_arn: arn)
    if wr && !wr.finalized?
      wr.update_status(status)
      sqs_msg.delete
      Rails.logger.info("Updated WorkflowRun #{wr.id} #{arn} to #{status}")
    end
  end

  def handle_phylo_tree_ng_update(arn, sqs_msg, status)
    pt = PhyloTreeNg.find_by(sfn_execution_arn: arn)
    if pt && !pt.finalized?
      pt.update_status(status)
      sqs_msg.delete
      Rails.logger.info("Updated PhyloTreeNg #{pt.id} #{arn} to #{status}")
    end
  end

  def handle_pipeline_run_update(arn, sqs_msg, details, status)
    pr = PipelineRun.find_by(sfn_execution_arn: arn)
    if pr
      unless pr.finalized?
        pr.async_update_job_status
        Rails.logger.info("Updated PipelineRun #{pr.id} #{arn} to #{status}")
      end

      # If the execution failed, try to load in any available results and mark the rest as failed.
      if ["TIMED_OUT", "ABORTED", "FAILED"].include?(status)
        Rails.logger.info("Loading results for PipelineRun #{pr.id} #{arn}")
        pr.monitor_results
      # If a stage has completed, load in the outputs from that stage into the db.
      elsif stage_complete_event?(details)
        pr.load_stage_results(details["lastCompletedStage"])
        Rails.logger.info("Loading #{details['lastCompletedStage']} results for PipelineRun #{pr.id} #{arn}")
      end

      sqs_msg.delete
    end
  end

  def stage_complete_event?(details)
    details["lastCompletedStage"].present?
  end
end
