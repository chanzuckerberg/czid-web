# frozen_string_literal: true

class LogUtil
  def self.log_err_and_airbrake(msg)
    Rails.logger.error(msg)
    Airbrake.notify(msg)
  end

  def self.log_backtrace(exception, msg = nil)
    if msg.nil?
      Rails.logger.error("Exception message: #{exception.try(:message)}. Backtrace:\n\t#{exception.try(:backtrace).try(:join, "\n\t")}")
    else
      Rails.logger.error("Error message: #{msg}. Exception message: #{exception.try(:message)}. Backtrace:\n\t#{exception.try(:backtrace).try(:join, "\n\t")}")
    end
  end
end
