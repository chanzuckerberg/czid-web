# ------------------------------------------------------------------------------
# At it's simplest, this task takes a csv list of taxids and a csv list of citations and creates a new pathogen list.
# This task can also be run in "dry run" mode to check for various missing/mismatched lineage data cases.
# The dry run primarily outputs two things:
#   1. A newline-delimited list of all the species_taxids that would make up the new pathogen_list.
#   2. A CSV of "pathogen misses": incoming pathogens that have some kind of mismatch with the taxon_lineages table.
#      Specifically, here is what the pathogen misses portion is checking for:
#   2A. It will check the name you provided for the pathogen in the incoming csv against the name in taxon_lineages for the same taxid.
#     It is your responsibility (working with comp bio) to ensure that the misnamings are benign. The species names provided
#     in the incoming csv are only used for the check. The name in taxon_lineages will be used for the pathogen_list.
#     This mostly exists to sanity check the pathogen curation process, that there were no mix-ups, etc.
#   2B. It will also check for cases in which the species_taxid does not match the taxid in the taxon_lineages table.
#     This happens when the lineage record is for a non-species level taxon (e.g. genus, family, sub-species).
#     It is your responsibility (working with comp bio) to remove genus and above level taxids from the csv.
#     Any remaining taxids that do not match the species_taxid are assumed to be sub-species: this rake task will
#     automatically assign the containing species_taxid for that sub-species to the resulting pathogen_list.
#   2C. It will check that each pathogen is represented in the most recent lineage version.
#     The taxon_lineages table has a concept of versioning: over time, the exact family > genus > species > sub-species
#     of a taxon's lineage can change based on research. The resulting pathogen_list should support flagging a
#     pathogen across all those versions. As part of that, we check that each incoming pathogen's taxid exists in the most
#     recent lineage version. If it does not, it is your responsibility (working with comp bio) to ensure it's benign.
# Once the dry run output has been reviewed and the csv files have been updated (this may take a few rounds of back-and-forth
# with comp bio), the task can be run again in non-dry run mode.
# No mismatch checks will be performed in non-dry run mode and all pathogen taxids that have corresponding entries
# in taxon_lineages will be added to the pathogen_list.
# ------------------------------------------------------------------------------
# ------------------------------------------------------------------------------
# How to use:
#   1. Upload to the czid-public-references/pathogen-list bucket in idseq-prod:
#      - global_pathogen_list_{version}.csv (Required CSV headers: Species, taxID)
#      - global_citation_list_{version}.csv (Required CSV headers: Source, Footnote)
#   2. Run `rake update_pathogen_list'.
#   3. Specify the list version you are updating (ie. 0.1.0)
#   4. Specify whether this is a dry run or not.
#       4A. You really should do a dry run first and verify things look good, even for seemingly small changes.
#       4B. For historical reference, please save the resolved taxids and pathogen misses to S3. These can be very
#           helpful to diff against when doing version updates to make sure things are changing in the expected way.
#           = Please save them in the same place the incoming pathogen CSV lives: czid-public-references/pathogen-list
#           = Save the resolved taxids as `resolved_taxids_x.y.z.txt`
#           = Save the pathogen misses as `pathogen_misses_by_taxid_x.y.z.csv`
# ------------------------------------------------------------------------------
# ------------------------------------------------------------------------------
# Notes:
# - For pathogen lists 0.2.0+, copies of the dry-run pathogen misses are available in the idseq-prod bucket (pathogen_misses_by_taxid_x.y.z.csv)
# - For pathogen lists 0.2.1+, copies of the dry-run resolved taxids are also available in the idseq-prod bucket (resolved_taxids_x.y.z.txt)
# - the script used to create the global_pathogen_list_0.2.0.csv from the google sheet that was provided by Katrina is in https://github.com/chanzuckerberg/idseq-pathogen-list-parser
#   - you will also find the exported google sheets that were used to create the global_pathogen_list_0.2.0.csv in the same repo
#   - pathogen list google sheet https://docs.google.com/spreadsheets/d/1ADyXdcE3E_YVa4oc4rz3vQ9os-HDVr_0K_pwDFeQ2Ow/edit#gid=1681096244
#   - citation list google sheet https://docs.google.com/spreadsheets/d/1M7RZ6TMTtu0u-zcCrhCjqMeavLKv4WL_PiO9WQ8-8HY/edit#gid=0
# - Updating to version 0.2.1 was motivated by CZID-9511 (adding new pathogen) and CZID-9571 (bugfix around lineage versions).
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

def resolve_taxids_for_pathogens(pathogens)
  # Figures out what taxon ids from DB should be used for the pathogen list.
  # We can't just directly use taxids from original input list because we have to
  # handle things like sub-species, taxon_lineages versioning over time, etc.
  # Returns two things: [resolved_taxids, not_found_pathogen_taxids]
  #   resolved_taxids: Set of all taxids that should be used for the pathogen list.
  #   not_found_pathogen_taxids: List of taxids in original list but not in the DB.
  resolved_taxids = Set.new # Using `Set` because repeats should be ignored.
  not_found_pathogen_taxids = []
  pathogens.each do |pathogen|
    pathogen_name = pathogen["Species"].strip
    pathogen_taxid = pathogen["taxID"].strip
    # Skip if no taxID is provided or we've already encountered it.
    if pathogen_taxid.empty? || resolved_taxids.include?(pathogen_taxid.to_i)
      next
    end

    # Get corresponding species_taxid over all taxon_lineages versions.
    # Normally the pathogen is a species and its taxid matches the TaxonLineage.species_taxid.
    # However, sometimes it is actually a sub-species, and then the species_taxid should be
    # used instead for the pathogen list. Thus we can always just use the species_taxid value.
    species_taxids = TaxonLineage.where(taxid: pathogen_taxid).pluck(:species_taxid)
    if species_taxids == []
      puts format(PathogenListHelper::TAXON_NOT_FOUND_TEMPLATE, pathogen_name, pathogen_taxid)
      not_found_pathogen_taxids << pathogen_taxid
    else
      resolved_taxids.merge species_taxids
    end
  end
  # Last ditch safety measure: ensure no species taxid is the missing species id.
  if resolved_taxids.delete?(TaxonLineage::MISSING_SPECIES_ID) || resolved_taxids.delete?(TaxonLineage::MISSING_SPECIES_ID_ALT)
    puts "WARNING: Removed missing species id value from resolved_taxids!"
    puts "This means one of the pathogens was targeting a genus-level or higher taxon."
    puts "Please inspect the dry run pathogen misses CSV to find the problematic pathogen(s)."
  end
  return resolved_taxids, not_found_pathogen_taxids
end

def dry_run(pathogens, pathogens_file_path)
  # Run how real ingestion would work except don't add anything to DB, just report it.
  puts("Resolving taxids from file: #{pathogens_file_path}")
  resolved_taxids, not_found_pathogen_taxids = resolve_taxids_for_pathogens(pathogens)
  puts("Found #{resolved_taxids.length} taxids in DB that would make up pathogen list.")
  unless not_found_pathogen_taxids.empty?
    puts("#{not_found_pathogen_taxids.length} pathogens had no corresponding entry in DB.")
    puts("Here are the taxIDs from the input CSV where pathogen was not in DB: #{not_found_pathogen_taxids}")
  end
  puts "Below are all the taxids that would be used for the pathogen list."
  puts "#{'=' * 10} Resolved taxids for file: #{pathogens_file_path} #{'=' * 10}"
  puts "#{'=' * 10} Run at #{Time.current} #{'=' * 10}" # This includes date info
  # Sort taxids and use line breaks  to enable easier diffing between runs
  puts resolved_taxids.sort.join("\n")
  puts "#{'=' * 10} END resolved taxids #{'=' * 10}"

  puts "Preparing CSV of all pathogen misses..."
  misses_csv_header = [
    'csv_name',
    'lineage_name',
    'csv_taxid',
    'lineage_species_taxid',
    'appears_in_latest_lineage_version',
  ]
  mismatched_taxids = [misses_csv_header]
  latest_lineage_version = TaxonLineage.maximum(:version_end)
  pathogens.each do |pathogen|
    pathogen_name = pathogen["Species"].strip
    pathogen_taxid = pathogen["taxID"].strip

    # Get taxon row for each pathogen that is most recent version available
    taxon = TaxonLineage.where(taxid: pathogen_taxid).order(version_end: :desc).first
    if taxon.nil?
      mismatched_taxids << [pathogen_name, "NOT_FOUND", pathogen_taxid, "NOT_FOUND", false]
    else
      is_latest_version = taxon.version_end == latest_lineage_version
      taxon_name = taxon.name
      if (pathogen_name.casecmp(taxon_name) != 0) || (taxon.species_taxid.to_i != pathogen_taxid.to_i)
        mismatched_taxids << [pathogen_name, taxon_name, pathogen_taxid, taxon.species_taxid, is_latest_version]
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
    dry_run(pathogens, pathogens_file_path)
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
  resolved_taxids, not_found_pathogen_taxids = resolve_taxids_for_pathogens(pathogens)
  resolved_taxids.each do |resolved_taxid|
    # Add Pathogen entries for any taxids we've never had as pathogens before.
    pathogen = Pathogen.find_by(tax_id: resolved_taxid)
    if pathogen.nil?
      pathogen = Pathogen.create(tax_id: resolved_taxid)
    end
    list_version.pathogens << pathogen
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
