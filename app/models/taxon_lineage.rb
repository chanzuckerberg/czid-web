# frozen_string_literal: true

# The TaxonLineage model gives the taxids forming the taxonomic lineage of any
# given species-level taxid.

# NOTES:
#
# So you've found a negative taxon ID. Now what?
# * See also "What is a taxon?" in taxon_count.rb.
# * NCBI will frequently categorize some records as unclassified or unassigned
#   at any possible level of the taxonomy (species, genus, family, order, class,
#   etc.). These informal ranks are "non-hierarchical names that reflect either
#   uncertainty of placement in a specific rank or represent informal and poorly
#   defined names in the NCBI classification"
#   (https://www.ncbi.nlm.nih.gov/pmc/articles/PMC7408187/).
# * A negative taxid is our internal way of encoding these entries in the
#   lineage for grouping and display purposes.
# * For example, "Bronnoya virus"
#   (https://www.ncbi.nlm.nih.gov/Taxonomy/Browser/wwwtax.cgi?id=2034337) has
#   species taxid 2034337, but its parent level is "unclassified Bunyavirales"
#   with no rank. The next defined level for this lineage is "Bunyavirales"
#   (order taxid 1980410), so there is no specific genus or family.
# * That means we would represent this lineage as species_taxid 2034337,
#   genus_taxid -200, family_taxid -300, order_taxid 1980410, etc. The missing
#   levels are filled in starting from -100 for species_taxid.
# * The Read Specificity filters on the Heatmap and Report Page toggle between
#   displaying these non-specific (negative) taxons.
# * What does it mean if there's a negative taxid that isn't -100, -200,
#   -300...? See docstring for _fill_missing_calls in the lineage.py link below.
# * More notes and a second example here:
#   https://github.com/chanzuckerberg/idseq-workflows/blob/main/short-read-mngs/idseq-dag/idseq_dag/util/lineage.py

require 'elasticsearch/model'

class TaxonLineage < ApplicationRecord
  if ELASTICSEARCH_ON
    include Elasticsearch::Model
    # WARNING: using this means you must ensure activerecord callbacks are
    #  called on all updates. This module updates elasticsearch using these
    #  callbacks. If you must circumvent them somehow (eg. using raw SQL or
    #  bulk_import) you must explicitly update elasticsearch appropriately.
    include ElasticsearchCallbacksHelper
  end
  include TaxonLineageHelper

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
    superkingdom: MISSING_SUPERKINGDOM_ID,
  }.freeze

  # 9605 is the genus, 9606 the species.
  HOMO_SAPIENS_TAX_IDS = [9605, 9606].freeze

  # From https://www.niaid.nih.gov/research/emerging-infectious-diseases-pathogens
  # Accessed 9/18/2018.
  # Categories are listed in order of priority (A, B, C). So if a taxon is included by the rules of both
  # category_A and category_C, for example, we will keep only category_A.
  # (When iterating over the hash key order is guaranteed to be the same as insertion order.)
  PRIORITY_PATHOGENS = {
    "categoryA" => Set[
      "Bacillus anthracis", "Clostridium botulinum", "Yersinia pestis",
      "orthopoxvirus", "Variola virus", "parapoxvirus", "yatapoxvirus", "molluscipoxvirus",
      "Francisella tularensis",
      "Arenavirus", "Argentinian mammarenavirus", "Machupo mammarenavirus", "Guanarito mammarenavirus",
      "Chapare mammarenavirus", "Lassa mammarenavirus", "Lujo mammarenavirus",
      "Bunyavirales", "Hantaviridae",
      "Flavivirus", "Dengue virus",
      "Filoviridae", "Ebolavirus", "Marburgvirus"
    ],
    "categoryB" => Set[
      "Burkholderia pseudomallei", "Coxiella burnetii", "Brucella", "Burkholderia mallei",
      "Chlaydia psittaci", "Ricinus communis", "Clostridium perfringens", "Staphylococcus aureus",
      "Rickettsia prowazekii", "Escherichia coli", "Vibrio cholerae", "Vibrio parahaemolyticus", "Vibrio vulnificus",
      "Shigella", "Salmonella", "Listeria monocytogenes", "Campylobacter jejuni", "Yersinia enterocolitica",
      "Caliciviridae", "Hepatovirus A", "Cryptosporidium parvum", "Cyclospora cayetanensis", "Giardia lamblia",
      "Entamoeba histolytica", "Toxoplasma gondii", "Naegleria fowleri", "Balamuthia mandrillaris", "Microsporidia",
      "West Nile virus", "California encephalitis orthobunyavirus", "Venezuelan equine encephalitis virus",
      "Eastern equine encephalitis virus", "Western equine encephalitis virus", "Japanese encephalitis virus",
      "Saint Louis encephalitis virus", "Yellow fever virus", "Chikungunya virus", "Zika virus"
    ],
    "categoryC" => Set[
      "Nipah henipavirus", "Hendra henipavirus", "Severe fever with thrombocytopenia virus", "Heartland virus",
      "Omsk hemorrhagic fever virus", "Kyasanur Forest disease virus", "Tick-borne encephalitis virus",
      "Powassan virus", "Mycobacterium tuberculosis",
      "unidentified influenza virus", "Influenza A virus", "Influenza B virus", "Influenza C virus",
      "Rickettsia", "Rabies lyssavirus", "prion", "Coccidioides",
      "Severe acute respiratory syndrome-related coronavirus", "Middle East respiratory syndrome-related coronavirus",
      "Acanthamoeba", "Anaplasma phagocytophilum", "Australian bat lyssavirus", "Babesia",
      "Bartonella henselae", "Human polyomavirus 1", "Bordetella pertussis", "Borrelia mayonii",
      "Borrelia miyamotoi", "Ehrlichia", "Anaplasma", "Enterovirus D", "Enterovirus A",
      "Hepacivirus C", "Orthohepevirus A", "Human betaherpesvirus 6", "Human gammaherpesvirus 8",
      "Human polyomavirus 2", "Leptospira", "Mucorales", "Mucor", "Rhizopus", "Absidia", "Cunninghamella",
      "Enterovirus C", "Measles morbillivirus", "Streptococcus sp. 'group A'"
    ],
  }.freeze

  CATEGORIES = {
    2 => "bacteria",
    2_157 => "archaea",
    2_759 => "eukaryota",
    10_239 => "viruses",
    12_884 => "viroids",
    nil => "uncategorized",
  }.freeze

  def tax_level
    TaxonCount::LEVEL_2_NAME.keys.sort.each do |level_int|
      level_str = TaxonCount::LEVEL_2_NAME[level_int]
      return level_int if self["#{level_str}_taxid"] > 0
    end
    nil
  end

  def name
    level_str = TaxonCount::LEVEL_2_NAME[tax_level]
    self["#{level_str}_name"]
  end

  def to_a
    TaxonLineage.names_a.map { |col| self[col] }
  end

  def self.names_a
    ['species_taxid', 'genus_taxid', 'family_taxid', 'order_taxid', 'class_taxid', 'phylum_taxid',
     'kingdom_taxid', 'superkingdom_taxid', 'superkingdom_name',]
  end

  def self.null_array
    TaxonLineage.column_defaults.values_at(*TaxonLineage.names_a)
  end

  def self.level_name(tax_level)
    level_str = "rank_#{tax_level}"
    level_str = 'species' if tax_level == TaxonCount::TAX_LEVEL_SPECIES
    level_str = 'genus' if tax_level == TaxonCount::TAX_LEVEL_GENUS
    level_str = 'family' if tax_level == TaxonCount::TAX_LEVEL_FAMILY
    level_str
  end

  def self.versioned_lineages(tax_ids, lineage_version)
    TaxonLineage
      .where(taxid: tax_ids)
      .where('? BETWEEN version_start AND version_end', lineage_version)
  end

  def self.fetch_lineage_by_taxid(tax_map, pipeline_run_id)
    t0 = Time.now.to_f
    # Get list of tax_ids to look up in TaxonLineage rows. Include family_taxids.

    tax_ids = tax_map.map { |x| x['tax_id'] }
    tax_ids |= tax_map.map { |x| x['family_taxid'] }

    # Find the right lineage entry to use based on the version. Lineage version_end
    # is incremented when the index is updated and the record is still valid, so
    # lineage_version should be between the inclusive range.
    lineage_version = PipelineRun
                      .select("alignment_configs.lineage_version")
                      .joins(:alignment_config)
                      .find(pipeline_run_id)[:lineage_version]

    # Extra fields for levels of _taxid and _name are used in the taxon tree
    required_columns = %w[
      taxid id superkingdom_taxid phylum_taxid class_taxid order_taxid family_taxid
      genus_taxid species_taxid superkingdom_name phylum_name class_name order_name
      family_name genus_name species_name superkingdom_common_name phylum_common_name
      class_common_name order_common_name family_common_name genus_common_name
      species_common_name kingdom_taxid kingdom_name kingdom_common_name tax_name
    ]
    lineage_by_taxid = versioned_lineages(tax_ids, lineage_version)
                       .pluck(*required_columns)
                       .map { |r| [r[0], required_columns.zip(r).to_h] }
                       .to_h

    t1 = Time.now.to_f
    Rails.logger.info "fetch_lineage_by_taxid took #{(t1 - t0).round(2)}s"

    lineage_by_taxid
  end
end
