require 'libhoney'

if ENV["IDSEQ_HONEYCOMB_WRITE_KEY"] && ENV["IDSEQ_HONEYCOMB_DATA_SET"] && ENV["IDSEQ_HONEYCOMB_DB_DATA_SET"]
  HoneycombRails.configure do |conf|
    conf.writekey = ENV["IDSEQ_HONEYCOMB_WRITE_KEY"]
    conf.dataset = ENV["IDSEQ_HONEYCOMB_DATA_SET"]
    conf.db_dataset = ENV["IDSEQ_HONEYCOMB_DB_DATA_SET"]
    conf.sample_rate = proc do |payload|
      case payload[:controller]
      when 'HealthCheck::HealthCheckController'
        60
      else
        1
      end
    end
  end
else
  HoneycombRails.configure do |conf|
    conf.client = Libhoney::NullClient.new
  end
end
