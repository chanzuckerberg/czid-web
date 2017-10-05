# See https://honeycomb.io/docs/guides/rails/
require 'libhoney'

if ENV["IDSEQ_HONEYCOMB_WRITE_KEY"] && ENV["IDSEQ_HONEYCOMB_DATA_SET"]

  HONEYCOMB = Libhoney::Client.new(writekey: ENV["IDSEQ_HONEYCOMB_WRITE_KEY"],
                                   dataset: ENV["IDSEQ_HONEYCOMB_DATA_SET"])

  # See http://guides.rubyonrails.org/active_support_instrumentation.html
  ActiveSupport::Notifications.subscribe(/process_action.action_controller/) do |*args|
    event = ActiveSupport::Notifications::Event.new(*args)

    # These are the keys we're interested in! Skipping noisy keys (:headers, :params) for now.
    data = event.payload.slice(:controller, :action, :method, :path, :format,
                               :status, :db_runtime, :view_runtime)

    # Massage data to return "all" as the :format if not set
    data[:format] = "all" if !data[:format] || data[:format] == "format:*/*"

    # Pull top-level attributes off of the ActiveSupport Event.
    data[:duration_ms] = event.duration

    HONEYCOMB.send_now(data)
  end

end
