require 'elasticsearch/model'

# Indexes records for elasticsearch record
class ElasticsearchIndex
  @queue = :elasticsearch_index

  def _index(index_name, index_type, record_id, indexed_json)
    Elasticsearch::Model.client.index(
      index: index_name,
      type: index_type,
      id: record_id,
      body: indexed_json
    )
  end

  def _delete(index_name, index_type, record_id)
    Elasticsearch::Model.client.delete(
      index: index_name,
      type: index_type,
      id: record_id
    )
  rescue Elasticsearch::Transport::Transport::Errors::NotFound
    Rails.logger.debug("Elasticsearch: Attempted to delete document: \
      #{record_id} from #{index_name} but it was not found")
  end

  def self.perform(operation, index_name, doc_type, record_id, indexed_json)
    Rails.logger.debug("Elasticsearch: Attempting to #{operation} \
      record: #{record_id} source table: #{index_name}")
    case operation.to_s
    when /index/
      _index(index_name, doc_type, record_id, indexed_json)
    when /delete/
      _delete(index_name, doc_type, record_id)
    else raise ArgumentError, "Unknown operation '#{operation}'"
    end
  rescue
    LogUtil.log_err_and_airbrake("Elasticsearch: Failed to #{operation} record: \
      #{record_id} source table: #{index_name}")
  end
end
