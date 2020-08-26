# frozen_string_literal: true

class LogUtil
  def self.log_err(msg)
    Rails.logger.error(msg)
    Airbrake.notify(msg)
    Raven.capture_message(msg)
  end

  def self.log_backtrace(exception)
    Rails.logger.error("Exception message: #{exception.message}")
    Rails.logger.error("Backtrace:\n\t#{exception.backtrace.join("\n\t")}")
  end
end
