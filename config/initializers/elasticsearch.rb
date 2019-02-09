# Flag to turn elasticsearch related behavior on or off.
# Change this to (Rails.env != 'test') once elasticsearch is ready to be used in dev/staging/prod.
# Elasticsearch is already switched on for TaxonLineage searches, since that change was safer.
ELASTICSEARCH_ON = false

# Initialize elasticsearch client
config = {
  host: ENV['ES_ADDRESS'],
  transport_options: { request: { timeout: 200 } }
}
Elasticsearch::Model.client = Elasticsearch::Client.new(config) if ELASTICSEARCH_ON
