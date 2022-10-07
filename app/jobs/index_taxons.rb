require 'elasticsearch/model'

# Indexes records for elasticsearch record
class IndexTaxons
  extend InstrumentedJob

  @queue = :index_taxons
  def self.perform(background_id, pipeline_run_id)
    Rails.logger.info("Start taxon indexing for pipeline_run_id: #{pipeline_run_id}")
    ElasticsearchQueryHelper.call_taxon_indexing_lambda(background_id, [pipeline_run_id])
  end
end
