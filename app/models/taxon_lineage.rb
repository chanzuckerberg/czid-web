# frozen_string_literal: true

# The TaxonLineage model gives the taxids forming the taxonomic lineage of any given species-level taxid.
require 'elasticsearch/model'

class TaxonLineage < ApplicationRecord
  unless Rails.env == "test"
    include Elasticsearch::Model
    include Elasticsearch::Model::Callbacks
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

  def self.get_genus_info(genus_tax_id)
    r = find_by(genus_taxid: genus_tax_id)
    return { query: r.genus_name, tax_id: genus_tax_id } if r
  end

  def self.fill_lineage_details(tax_map, pipeline_run_id)
    t2 = Time.now.to_f

    # Set lineage info from the first positive tax_id of the species, genus, or family levels.
    # Preserve names of the negative 'non-specific' nodes.
    # Used for the tree view and sets appropriate lineage info at each node.
    lineage_by_taxid = fetch_lineage_by_taxid(tax_map, pipeline_run_id)

    # Make a new hash with 'species_taxid', 'genus_taxid', etc.
    missing_vals = Hash[MISSING_LINEAGE_ID.map { |k, v| [k.to_s + "_taxid", v] }]

    name_columns = column_names.select { |cn| cn.include?("_name") }
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

      # Tag pathogens
      pathogen_tags = []
      PRIORITY_PATHOGENS.each do |category, pathogen_list|
        name_columns.each do |col|
          pathogen_tags |= [category] if pathogen_list.include?(tax['lineage'][col])
        end
      end
      best_tag = pathogen_tags[0] # first element is highest-priority element (see PRIORITY_PATHOGENS documentation)
      tax['pathogenTag'] = best_tag
    end

    t3 = Time.now.to_f
    Rails.logger.info "tax_map took #{(t3 - t2).round(2)}s"

    tax_map
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
