class LogHelper
  def self.log_err_and_airbrake(msg)
    Rails.logger.error(msg)
    Airbrake.notify(msg)
  end
end
