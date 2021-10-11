module PathogenListHelper
  PROMPT_FOR_LIST_VERSION = "Please enter a pathogen list version (ie. 0.1.0):".freeze
  CONFIRM_VERSION_CREATION = "Version %s not found. Do you want to create a new version? (yes/NO)".freeze
  CONFIRM_LIST_VERSION_OVERWRITE = "Version %s already exists. Do you want to overwrite this version? (yes/NO)".freeze
  TAXON_NOT_FOUND_TEMPLATE = "Taxon not found: [species=%s taxID=%s]".freeze
  MISMATCHED_PATHOGEN_NAMES_TEMPLATE = "Species and taxon names do not match [species name (from csv)=%s, taxon name (from TaxonLineage)=%s]".freeze
  CONFIRM_TAXON_NAME_TEMPLATE = "Do you want to continue with %s? (yes/NO)".freeze
  UPDATE_PROCESS_COMPLETE_TEMPLATE = "Process complete: global pathogen list %s created with %s pathogens".freeze
  UNLISTED_PATHOGENS_TEMPLATE = '%s pathogens with the following tax_ids were not added to this version: %s'.freeze
  UPDATE_PROCESS_FAILED = "Update pathogen list failed".freeze
end
