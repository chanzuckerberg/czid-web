# The TaxonLineage model gives the taxids forming the taxonomic lineage of any given species-level taxid.

class TaxonLineage < ApplicationRecord
  INVALID_CALL_BASE_ID = -100_000_000 # don't run into -2e9 limit (not common, mostly a concern for fp32 or int32)
  MISSING_SPECIES_ID = -100
  MISSING_SPECIES_ID_ALT = -1
  MISSING_GENUS_ID = -200
  BLACKLIST_GENUS_ID = -201
  MISSING_FAMILY_ID = -300
  MISSING_ORDER_ID = -400
  MISSING_CLASS_ID = -500
  MISSING_PHYLUM_ID = -600
  MISSING_KINGDOM_ID = -650
  MISSING_SUPERKINGDOM_ID = -700
  MISSING_LINEAGE_ID = {
    species: MISSING_SPECIES_ID,
    genus: MISSING_GENUS_ID,
    family: MISSING_FAMILY_ID,
    order: MISSING_ORDER_ID,
    class: MISSING_CLASS_ID,
    phylum: MISSING_PHYLUM_ID,
    kingdom: MISSING_KINGDOM_ID,
    superkingdom: MISSING_SUPERKINGDOM_ID
  }.freeze

  # We label as 'phage' all of the prokaryotic (bacterial and archaeal) virus families
  # listed here: https://en.wikipedia.org/wiki/Bacteriophage
  # PHAGE_FAMILIES_NAMES = ['Myoviridae', 'Siphoviridae', 'Podoviridae', 'Lipothrixviridae',
  #                         'Rudiviridae', 'Ampullaviridae', 'Bicaudaviridae', 'Clavaviridae',
  #                         'Corticoviridae', 'Cystoviridae', 'Fuselloviridae', 'Globuloviridae',
  #                         'Guttaviridae', 'Inoviridae', 'Leviviridae', 'Microviridae',
  #                         'Plasmaviridae', 'Tectiviridae']
  # PHAGE_FAMILIES_TAXIDS = TaxonLineage.where(family_name: PHAGE_PHYLA_NAMES).map(&:family_taxid).compact.uniq.sort
  PHAGE_FAMILIES_TAXIDS = [10_472, 10_474, 10_477, 10_656, 10_659, 10_662, 10_699, 10_744, 10_841, 10_860,
                           10_877, 11_989, 157_897, 292_638, 324_686, 423_358, 573_053, 1_232_737].freeze

  def self.get_genus_info(genus_tax_id)
    r = find_by(genus_taxid: genus_tax_id)
    return { query: r.genus_name, tax_id: genus_tax_id } if r
  end

  def self.fill_lineage_details(tax_map, pipeline_run_id)
    # Get list of tax_ids to look up in TaxonLineage rows. Include family_taxids.
    tax_ids = tax_map.map { |x| x['tax_id'] }
    tax_ids |= tax_map.map { |x| x['family_taxid'] }

    # Get created_at date for our TaxonCount entries. Same for all TaxonCounts
    # in a PipelineRun.
    valid_date = PipelineRun.find(pipeline_run_id).taxon_counts.last.created_at

    # TODO: Should definitely be simplified with taxonomy/lineage refactoring.
    lineage_by_taxid = {}

    # Since there may be multiple TaxonLineage entries with the same taxid
    # now, we only select the valid entry based on started_at and ended_at.
    # The valid lineage entry has start and end dates that include the valid
    # taxon count entry date.
    TaxonLineage.where(taxid: tax_ids).where("started_at < ? AND ended_at > ?", valid_date, valid_date).each do |x|
      lineage_by_taxid[x.taxid] = x.as_json
    end

    # Set lineage info from the first positive tax_id of the species, genus, or family levels.
    # Preserve names of the negative 'non-specific' nodes.
    # Used for the tree view and sets appropriate lineage info at each node.

    # Make a new hash with 'species_taxid', 'genus_taxid', etc.
    missing_vals = Hash[MISSING_LINEAGE_ID.map { |k, v| [k.to_s + "_taxid", v] }]

    tax_map.each do |tax|
      # Grab the appropriate lineage info by the first positive tax level
      lineage_id = most_specific_positive_id(tax)
      tax['lineage'] = if lineage_id
                         lineage_by_taxid[lineage_id] || missing_vals.dup
                       else
                         missing_vals.dup
                       end

      tax['lineage']['taxid'] = tax['tax_id']
      tax['lineage']['species_taxid'] = tax['species_taxid']
      tax['lineage']['genus_taxid'] = tax['genus_taxid']
      tax['lineage']['family_taxid'] = tax['family_taxid']

      # Set the name
      name = level_name(tax['tax_level']) + "_name"
      tax['lineage'][name] = tax['name']
    end

    tax_map
  end

  def self.most_specific_positive_id(tax)
    targets = [tax['species_taxid'], tax['genus_taxid'], tax['family_taxid']]
    targets.each do |tentative_id|
      return tentative_id if tentative_id && tentative_id > 0
    end
    nil
  end

  def self.level_name(tax_level)
    level_str = "rank_#{tax_level}"
    level_str = 'species' if tax_level == TaxonCount::TAX_LEVEL_SPECIES
    level_str = 'genus' if tax_level == TaxonCount::TAX_LEVEL_GENUS
    level_str = 'family' if tax_level == TaxonCount::TAX_LEVEL_FAMILY
    level_str
  end
end
