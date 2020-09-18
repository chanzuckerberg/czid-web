# frozen_string_literal: true

class LogUtil
  def self.log_err(msg)
    Rails.logger.error(msg)
    Raven.capture_message(msg)
  end

  def self.log_backtrace(exception)
    Rails.logger.error("Exception message: #{exception.message}")
    Rails.logger.error("Backtrace:\n\t#{exception.backtrace.join("\n\t")}")
  end

  def self.log_error(message, exception: nil, **details)
    # TODO(tiago): [CH-13826] add json support
    Rails.logger.error({
      message: message,
      exception: exception&.message,
      backtrace: exception&.backtrace,
      details: details,
    }.to_json)
    if exception
      Raven.capture_exception(
        exception,
        message: message,
        extra: details
      )
    end
  end
end
