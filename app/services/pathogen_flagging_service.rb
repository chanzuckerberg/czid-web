class PathogenFlaggingService
  include Callable
  include ElasticsearchQueryHelper

  def initialize(
    pipeline_run_ids:,
    background_id:
  )
    @pipeline_run_ids = pipeline_run_ids
    if background_id
      # make sure background exists
      Background.find(background_id)
    end
    @background_id = background_id # will be null if the user has not selected a background
  end

  def call
    return generate
  end

  private

  # given a list of pipeline run ids and a background, return a hash that will return the list of pathogen flags
  # for a given pipeline_run_id and tax_id
  # e.g. { 123 => { 1234 => ["known_pathogen"] } }
  def generate
    known_pathogens = PathogenList.find_by(is_global: true).fetch_list_version().fetch_pathogens_info().pluck(:tax_id)

    # this allows dynamically selected pathogen lists in the future
    known_pathogen_tax_ids = known_pathogens.map(&:to_i)
    taxon_counts = TaxonCount.where(tax_id: known_pathogen_tax_ids, pipeline_run_id: @pipeline_run_ids)
    known_pathogens_by_pr_id = taxon_counts.group_by(&:pipeline_run_id).transform_values { |counts| counts.map(&:tax_id) }
    return known_pathogens_by_pr_id
  end
end
