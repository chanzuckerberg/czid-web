# ------------------------------------------------------------------------------
# At it's simplest, this task takes a csv list of taxids and a csv list of citations and creates a new pathogen list.
# This task can also be run in "dry run" mode to check for a couple of missing/mismatched lineage data cases.
#   1. It will check the name that you provided for the pathogen taxid in the csv against the name we have in the taxon_lineage table for the same taxid.
#     It will be the user's responsibility to ensure that the misnamings are benign. The species names provided
#     in the csv are only used for the check. The name in the taxon_lineage table will be used for the pathogen_list.
#   2. It will also check for cases in which the species_taxid does not match the taxid in the taxon_lineage table.
#     This happens when the lineage record is for a non-species level taxon (e.g. genus, family, sub-species).
#     It will be the user's responsibility to remove genus and above level taxids from the csv before uploading.
#     Any remaining taxids that do not match the species_taxid are assumed to be sub-species and the uploader will
#     automatically assign the species_taxid rather than the taxid to the pathogen_list.
# Once the dry run output has been reviewed and the csv files have been updated, the task can be run again in non-dry run mode.
# No mismatch checks will be performed in non-dry run mode and all provided taxids will be added to the pathogen list.
# ------------------------------------------------------------------------------
# ------------------------------------------------------------------------------
# How to use:
#   1. Upload to the czid-public-references/pathogen-list bucket in idseq-prod:
#      - global_pathogen_list_{version}.csv (Required CSV headers: Species, taxID)
#      - global_citation_list_{version}.csv (Required CSV headers: Source, Footnote)
#   2. Run `rake update_pathogen_list'.
#   3. Specify the list version you are updating (ie. 0.1.0)
#   4. Specify whether this is a dry run or not.
# ------------------------------------------------------------------------------
# ------------------------------------------------------------------------------
# Notes:
# - a copy of the dry-run output that was produced before the 0.2.0 update is available in the idseq-prod bucket (pathogen_misses_by_taxid_0.2.0.csv)
# - the script used to create the global_pathogen_list_0.2.0.csv from the google sheet that was provided by Katrina is in https://github.com/chanzuckerberg/idseq-pathogen-list-parser
#   - you will also find the exported google sheets that were used to create the global_pathogen_list_0.2.0.csv in the same repo
#   - pathogen list google sheet https://docs.google.com/spreadsheets/d/1ADyXdcE3E_YVa4oc4rz3vQ9os-HDVr_0K_pwDFeQ2Ow/edit#gid=1681096244
#   - citation list google sheet https://docs.google.com/spreadsheets/d/1M7RZ6TMTtu0u-zcCrhCjqMeavLKv4WL_PiO9WQ8-8HY/edit#gid=0
# ------------------------------------------------------------------------------

require 'csv'
require 'aws-sdk-s3'

def prompt_for_input(prompt)
  puts prompt
  STDIN.gets.strip
end

def create_pathogen_list
  input = prompt_for_input("Global pathogen list not found. Do you want to create one? (yes/NO)")
  if input != "yes"
    raise PathogenListHelper::UPDATE_PROCESS_FAILED
  end

  PathogenList.create(
    creator_id: nil,
    is_global: true
  )
end

def create_list_version(global_pathogen_list, version)
  input = prompt_for_input(PathogenListHelper::CONFIRM_VERSION_CREATION % version)
  if input != "yes"
    raise PathogenListHelper::UPDATE_PROCESS_FAILED
  end

  PathogenListVersion.create(
    pathogen_list: global_pathogen_list,
    version: version
  )
end

def create_citation(source_key, source_footnote)
  puts format(PathogenListHelper::CITATION_NOT_FOUND, source_key)
  input = prompt_for_input(format(PathogenListHelper::PROMPT_CITATION_CREATE, source_footnote))
  if input != "yes"
    nil
  else
    Citation.create(
      key: source_key,
      footnote: source_footnote
    )
  end
end

def dry_run(pathogens)
  mismatched_taxids = [['csv_name', 'lineage_name', 'csv_taxid', 'lineage_species_taxid']]
  pathogens.each do |pathogen|
    species_name = pathogen["Species"].strip
    taxid = pathogen["taxID"].strip

    # Get taxon
    taxon = TaxonLineage.where(taxid: taxid).last
    if taxon.nil?
      mismatched_taxids << [species_name, "NOT_FOUND", taxid, "NOT_FOUND"]
    else
      taxon_name = taxon.name
      if (species_name.casecmp(taxon_name) != 0) || (taxon.species_taxid.to_i != taxid.to_i)
        mismatched_taxids << [species_name, taxon_name, taxid, taxon.species_taxid]
      end
    end
  end
  puts(mismatched_taxids.map(&:to_csv).join)
end

task update_pathogen_list: :environment do
  version = prompt_for_input(PathogenListHelper::PROMPT_FOR_LIST_VERSION)
  pathogens_file_path = "pathogen-list/global_pathogen_list_#{version}.csv"
  citations_file_path = "pathogen-list/global_citation_list_#{version}.csv"
  bucket_name = S3_DATABASE_BUCKET

  # Parse csv
  pathogens = PathogenList.parse_input_file_csv(bucket_name, pathogens_file_path, ["Species", "taxID"])
  citations = PathogenList.parse_input_file_csv(bucket_name, citations_file_path, ["Source", "Footnote"])

  if prompt_for_input(PathogenListHelper::PROMPT_FOR_DRY_RUN) == "yes"
    dry_run(pathogens)
    next # exits the task
  end

  if prompt_for_input(PathogenListHelper::PROMPT_FOR_NON_DRY_RUN) != "yes"
    raise PathogenListHelper::USER_CANCELLED
  end

  # Get pathogen list
  global_pathogen_list = PathogenList.where(is_global: true)
  if global_pathogen_list.size > 1
    Rails.logger.error("More than 1 global pathogen list found [count=#{global_pathogen_list.size}")
    raise PathogenListHelper::UPDATE_PROCESS_FAILED
  end

  global_pathogen_list = global_pathogen_list.first
  if global_pathogen_list.nil?
    global_pathogen_list = create_pathogen_list()
  end

  # Get pathogen list version
  list_version = PathogenListVersion.find_by(pathogen_list: global_pathogen_list.id, version: version)
  if list_version.nil?
    list_version = create_list_version(global_pathogen_list, version)
  else
    input = prompt_for_input(PathogenListHelper::CONFIRM_LIST_VERSION_OVERWRITE % version)
    if input == "yes"
      list_version.pathogens.clear
      list_version.citations.clear
    else
      raise PathogenListHelper::UPDATE_PROCESS_FAILED
    end
  end

  # Add pathogens to list version
  not_found_pathogen_taxids = []
  pathogens.each do |pathogen|
    species_name = pathogen["Species"].strip
    taxid = pathogen["taxID"].strip

    # Skip if pathogen already exists in the version
    # Skip if no taxID is provided
    if list_version.pathogens.exists?(tax_id: taxid) || taxid.empty?
      next
    end

    # Get taxon
    taxon = TaxonLineage.where(taxid: taxid).last
    if taxon.nil?
      puts format(PathogenListHelper::TAXON_NOT_FOUND_TEMPLATE, species_name, taxid)
      not_found_pathogen_taxids << taxid
    else
      # when species_taxid is different from taxid, it means that the taxid is a subspecies
      # it should still be loaded into the database, but the species_taxid from our lineage table should be used instead
      if taxon.species_taxid != taxid
        taxid = taxon.species_taxid
      end

      pathogen = Pathogen.find_by(tax_id: taxid)
      if pathogen.nil?
        pathogen = Pathogen.create(tax_id: taxid)
      end

      list_version.pathogens << pathogen
    end
  end

  # Add citations to list version
  citations.each do |citation|
    source_key = citation["Source"].parameterize.underscore.strip
    source_footnote = citation["Footnote"].strip

    # Skip if citation already exists in the version
    if list_version.citations.exists?(key: source_key)
      next
    end

    # Get citation if exists, otherwise create
    citation = Citation.find_by(key: source_key)
    if citation.nil?
      citation = create_citation(source_key, source_footnote)
    end

    # Add citation to list version
    unless citation.nil?
      list_version.citations << citation
    end
  end

  # Confirmation
  puts format(PathogenListHelper::UPDATE_PROCESS_COMPLETE_TEMPLATE, version, list_version.pathogens.count, list_version.citations.count)
  unless not_found_pathogen_taxids.empty?
    puts format(PathogenListHelper::NOT_FOUND_PATHOGENS_TEMPLATE, not_found_pathogen_taxids.length, not_found_pathogen_taxids)
  end
end
