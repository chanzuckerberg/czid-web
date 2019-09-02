# frozen_string_literal: true

class LogUtil
  def self.log_err_and_airbrake(msg, exception = nil)
    LogUtil.log_backtrace(exception, msg)
    Airbrake.notify(msg)
  end

  def self.log_backtrace(exception, msg = nil)
    if exception.respond_to? :backtrace
      Rails.logger.error("#{msg}. Exception: #{exception.try(:message)}. Backtrace:\n\t#{exception.try(:backtrace).try(:join, "\n\t")}")
    else
      Rails.logger.error("#{msg}. Exception:\n\t#{exception}")
    end
  end
end
