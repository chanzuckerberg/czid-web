require 'elasticsearch/model'

# Indexes records for elasticsearch record
class ElasticsearchIndex
  extend InstrumentedJob

  # Hash where key == the self.perform parameter you wish to add as extra dimension and value == name of the dimension
  extra_dimensions operation: "Operation"

  @queue = :elasticsearch_index
  def self.perform(operation, index_name, doc_type, record_id, indexed_json)
    Rails.logger.debug("Elasticsearch: Attempting to #{operation} record: #{record_id} source table: #{index_name}")
    case operation.to_s
    when /index/
      Elasticsearch::Model.client.index(index: index_name, type: doc_type, id: record_id, body: indexed_json)
      Rails.logger.debug("Elasticsearch: Successfully indexed record: #{record_id} source table: #{index_name}")
    when /delete/
      Elasticsearch::Model.client.delete(index: index_name, type: doc_type, id: record_id)
      Rails.logger.debug("Elasticsearch: Successfully deleted record: #{record_id} source table: #{index_name}")
    else raise ArgumentError, "Unknown operation '#{operation}'"
    end
  rescue Elasticsearch::Transport::Transport::Errors::NotFound
    Rails.logger.debug("Elasticsearch: Attempted to delete document: #{record_id} from #{index_name} but it was not found")
    raise # Raise error in order to fire on_failure resque hook in InstrumentedJob
  rescue => err
    Rails.logger.error(err)
    LogUtil.log_backtrace(err)
    LogUtil.log_err_and_airbrake("Elasticsearch failed to #{operation} record: #{record_id} source table: #{index_name}, with error: #{err.message}")
    raise err # Raise error in order to fire on_failure resque hook in InstrumentedJob
  end
end
