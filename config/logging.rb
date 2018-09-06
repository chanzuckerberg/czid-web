Logging::Rails.configure do |config|
  # Configure the Logging framework with the default log levels
  Logging.init %w[debug info warn error fatal]

  Logging.format_as :json

  # Configure an appender that will write log events to STDOUT. A colorized
  # pattern layout is used to format the log events into strings before
  # writing.
  if config.log_to.include? 'stdout'
    Logging.appenders.stdout('stdout',
                             auto_flushing: true,
                             layout: Logging.layouts.json)
  end

  # The default layout used by the appenders.
  layout = Logging.layouts.pattern(pattern: '[%d] %-5l %c : %m\n')

  # Configure an appender that will write log events to a file. The file will
  # be rolled on a daily basis, and the past 7 rolled files will be kept.
  # Older files will be deleted. The default pattern layout is used when
  # formatting log events into strings.
  if config.log_to.include? 'file'
    Logging.appenders.rolling_file('file',
                                   filename: config.paths['log'].first,
                                   keep: 7,
                                   age: 'daily',
                                   truncate: false,
                                   auto_flushing: true,
                                   layout: layout)
  end

  Logging.logger.root.level = :debug
  Logging.logger.root.appenders = config.log_to unless config.log_to.empty?
end
