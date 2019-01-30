config = {
  host: ENV['ES_ADDRESS'],
  transport_options: { request: { timeout: 200 } }
}
Elasticsearch::Model.client = Elasticsearch::Client.new(config) unless Rails.env == 'test'
