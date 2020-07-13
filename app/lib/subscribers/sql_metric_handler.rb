module Subscribers
  class SQLMetricHandler < Base
    # TODO(omar): Would like to find what action controller called which query to give the event some context
    def process_event
      raw_sql_query = event.payload[:sql].frozen? ? event.payload[:sql].dup : event.payload[:sql]

      event_log = {
        type: "metric",
        source: "backend",
        msg: "sql.active_record",
        v: 1,
        details: {
          query: clean_sql_query(raw_sql_query),
          cached: event.payload[:cached],
          event_duration: event.duration,
        },
      }

      # event.payload[:exception] => ["exception name", "exception message"]
      if event.payload[:exception].present?
        event_log[:details][:exception] = {
          name: event.payload[:exception][0],
          message: event.payload[:exception][1],
        }
      end

      logger.info(event_log)
    end

    # Helper function to canonicalize SQL queries
    def clean_sql_query(query)
      query.squish!
      query.gsub!(/(\s(=|>|<|>=|<=|<>|!=)\s)('[^']+'|[\$\+\-\w\.]+)/, '\1?')
      query.gsub!(/(\sIN\s)\([^\(\)]+\)/i, '\1(?)')
      query.gsub!(/(\sBETWEEN\s)('[^']+'|[\+\-\w\.]+)(\sAND\s)('[^']+'|[\+\-\w\.]+)/i, '\1?\3?')
      query.gsub!(/(\sVALUES\s)\(.+\)/i, '\1(?)')
      query.gsub!(/(\s(LIKE|ILIKE|SIMILAR TO|NOT SIMILAR TO)\s)('[^']+')/i, '\1?')
      query.gsub!(/(\s(LIMIT|OFFSET)\s)(\d+)/i, '\?')
      query
    end
  end
end
