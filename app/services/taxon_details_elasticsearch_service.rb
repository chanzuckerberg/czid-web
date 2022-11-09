# This is a class of static helper methods for generating data for the heatmap
# visualization. See HeatmapElasticsearchHelperTest.
# See selectedOptions in SamplesHeatmapView for client-side defaults, and
# heatmap action in VisualizationsController.
class TaxonDetailsElasticsearchService
  include Callable
  include ElasticsearchQueryHelper

  def initialize(
    pr_id_to_sample_id:,
    samples:,
    taxon_ids:,
    background_id:
  )
    @pr_id_to_sample_id = pr_id_to_sample_id
    @samples = samples
    @taxon_ids = taxon_ids
    @background_id = background_id
  end

  def call
    return generate
  end

  # used when a user manually adds a taxon to a heatmap
  def generate
    all_metrics_per_sample_and_taxa = ElasticsearchQueryHelper.all_metrics_per_sample_and_taxa(
      @pr_id_to_sample_id.keys(),
      @taxon_ids,
      @background_id
    )

    results_by_pr = ElasticsearchQueryHelper.organize_data_by_pr(all_metrics_per_sample_and_taxa, @pr_id_to_sample_id)

    dict = ElasticsearchQueryHelper.samples_taxons_details(
      results_by_pr,
      @samples
    )
    return dict
  end
end
