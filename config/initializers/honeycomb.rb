
if ENV["IDSEQ_HONEYCOMB_WRITE_KEY"] && ENV["IDSEQ_HONEYCOMB_DATA_SET"] && ENV["IDSEQ_HONEYCOMB_DB_DATA_SET"]
  HoneycombRails.configure do |conf|
    conf.writekey = ENV["IDSEQ_HONEYCOMB_WRITE_KEY"]
    conf.dataset = ENV["IDSEQ_HONEYCOMB_DATA_SET"]
    conf.db_dataset = ENV["IDSEQ_HONEYCOMB_DB_DATA_SET"]
    conf.sample_rate = proc do |event_type, payload|
      case event_type
      when 'sql.active_record'
        1
      when 'process_action.action_controller'
        case payload[:controller]
        when 'HealthCheck::HealthCheckController'
          60
        else
          1
        end
      else
        1
      end
    end
  end
end
