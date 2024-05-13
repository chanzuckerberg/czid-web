module PathogenListHelper
  PROMPT_FOR_LIST_VERSION = "Please enter a pathogen list version (ie. 0.1.0):".freeze
  PROMPT_FOR_DRY_RUN = "Is this a dry run to check for missing/mismatched lineage data? (yes/NO)".freeze
  PROMPT_FOR_NON_DRY_RUN = "You have indicated that this is a non-dry run. Are you ready to proceed with the pathogen list update? (yes/NO)".freeze
  CONFIRM_VERSION_CREATION = "Version %s not found. Do you want to create a new version? (yes/NO)".freeze
  CONFIRM_LIST_VERSION_OVERWRITE = "Version %s already exists. Do you want to overwrite this version? (yes/NO)".freeze
  TAXON_NOT_FOUND_TEMPLATE = "Taxon not found: [pathogen=%s taxID=%s]".freeze
  UPDATE_PROCESS_COMPLETE_TEMPLATE = "Process complete: global pathogen list %s created with %s pathogens and %s citations".freeze
  NOT_FOUND_PATHOGENS_TEMPLATE = '%s pathogens with the following tax_ids had no associated taxon_lineage and was not added to the pathogen list: %s'.freeze
  UPDATE_PROCESS_FAILED = "Update pathogen list failed".freeze
  USER_CANCELLED = "User cancelled pathogen list update".freeze
  CITATION_NOT_FOUND = "Citation not found: [source=%s]".freeze
  PROMPT_CITATION_CREATE = "Do you want to create this citation [footnote=%s]? (yes/NO)".freeze
end
