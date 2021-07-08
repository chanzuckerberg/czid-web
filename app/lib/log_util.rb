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
      Raven.capture_exception(
        exception,
        message: message,
        extra: details
      )
    end
  end

  def self.log_message(message, **details)
    Raven.capture_message(
      message,
      extra: details
    )
  end
end
