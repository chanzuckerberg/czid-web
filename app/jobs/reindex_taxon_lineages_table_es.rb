require 'elasticsearch/model'

# TODO(nina) do not run until creating the new taxon lineages ES index has been safely
# implemented for zero downtime.
# Reindexing the taxon lineages table took ~18 hours locally for 3.3 million records
class ReindexTaxonLineagesTableEs
  extend InstrumentedJob

  @queue = :index_taxon_lineages
  def self.perform
    TaxonLineage.__elasticsearch__.create_index!(force: true)
    TaxonLineage.__elasticsearch__.import
  end
end
