# frozen_string_literal: true

class LogUtil
  def self.log_error(message, exception: nil, **details)
    # TODO(tiago): [CH-13826] add json support
    Rails.logger.error({
      message: message,
      exception: exception&.message,
      backtrace: exception&.backtrace,
      details: details,
    }.to_json)
    if exception
      # Exceptions have a default level of "error".
      Raven.capture_exception(
        exception,
        message: message,
        extra: details
      )
    end
  end

  # If you want to report a message rather than an exception you can use the log_message method.
  def self.log_message(message, **details)
    Raven.capture_message(
      message,
      level: "info",
      extra: details
    )
  end
end
