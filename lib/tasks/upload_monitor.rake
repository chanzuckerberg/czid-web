desc 'Alerts then fails uploads that take too long. It is designed to be run in
a loop with `watch -n10 rake upload_monitor`.'
task "upload_monitor", [:duration] => :environment do
  Rails.logger.info("Monitoring uploads")
  # TODO: (gdingle): finish task body
end
