# Flag to turn elasticsearch callbacks on or off for Project/Sample/Metadatum/User models
ELASTICSEARCH_ON = (Rails.env != 'test')

# Initialize elasticsearch client
config = {
  host: ENV['ES_ADDRESS'],
  transport_options: { request: { timeout: 200 } }
}
Elasticsearch::Model.client = Elasticsearch::Client.new(config) if Rails.env != 'test'
