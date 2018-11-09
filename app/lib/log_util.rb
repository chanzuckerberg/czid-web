class LogUtil
  def self.log_err_and_airbrake(msg)
    Rails.logger.error(msg)
    Airbrake.notify(msg)
  end

  def self.log_backtrace(exception)
    Rails.logger.error("Backtrace:\n\t#{exception.backtrace.join("\n\t")}")
  end
end
