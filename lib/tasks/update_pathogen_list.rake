# ------------------------------------------------------------------------------
# Goal: Update the global pathogen list
#
# How to use:
#   1. Upload the global pathogen list csv to idseq-public-references/pathogen-list in idseq-prod.
#      CSV name: global_list_{version}.csv
#      Required CSV headers: Species, taxID, Source, Footnote
#   2. Run `rake update_pathogen_list'.
#   3. Specify the list version you are updating (ie. 0.1.0)
#   4. Verify changes described
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
  puts "Citation not found: [source=#{source_key}]"
  input = prompt_for_input("Do you want to create this citation [footnote=#{source_footnote}]? (yes/NO)")
  if input != "yes"
    nil
  else
    Citation.create(
      key: source_key,
      footnote: source_footnote
    )
  end
end

task update_pathogen_list: :environment do
  version = prompt_for_input(PathogenListHelper::PROMPT_FOR_LIST_VERSION)
  file_path = "pathogen-list/global_list_#{version}.csv"
  bucket_name = S3_DATABASE_BUCKET

  # Parse csv
  pathogens = PathogenList.parse_pathogen_list_csv(bucket_name, file_path)

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
    else
      raise PathogenListHelper::UPDATE_PROCESS_FAILED
    end
  end

  # Add pathogens to list version
  unlisted_pathogen_taxids = []
  pathogens.each do |pathogen|
    species_name = pathogen["Species"].strip
    taxid = pathogen["taxID"].strip
    source_key = pathogen["Source"].parameterize.underscore.strip
    source_footnote = pathogen["Footnote"].strip

    # Skip if pathogen already exists in the version
    # Skip if no taxID is provided
    if list_version.pathogens.exists?(tax_id: taxid) || taxid.empty?
      next
    end

    # Get taxon
    taxon = TaxonLineage.where(taxid: taxid, species_taxid: taxid).last
    if taxon.nil?
      puts format(PathogenListHelper::TAXON_NOT_FOUND_TEMPLATE, species_name, taxid)
      unlisted_pathogen_taxids << taxid
    else
      taxon_name = taxon.name
      if species_name.casecmp(taxon_name) != 0
        puts format(PathogenListHelper::MISMATCHED_PATHOGEN_NAMES_TEMPLATE, species_name, taxon_name)
        input = prompt_for_input(PathogenListHelper::CONFIRM_TAXON_NAME_TEMPLATE % taxon_name)
        if input != "yes"
          unlisted_pathogen_taxids << taxid
          next
        end
      end

      # Find pathogen
      pathogen = Pathogen.find_by(tax_id: taxid)
      if pathogen.nil?
        pathogen = Pathogen.create(tax_id: taxid)

        # Get citation
        citation = Citation.find_by(key: source_key)
        if citation.nil?
          citation = create_citation(source_key, source_footnote)
        end

        unless citation.nil?
          pathogen.update(citation_id: citation.id)
        end
      end

      list_version.pathogens << pathogen
    end
  end

  # Confirmation
  puts format(PathogenListHelper::UPDATE_PROCESS_COMPLETE_TEMPLATE, version, list_version.pathogens.count)
  unless unlisted_pathogen_taxids.empty?
    puts format(PathogenListHelper::UNLISTED_PATHOGENS_TEMPLATE, unlisted_pathogen_taxids.length, unlisted_pathogen_taxids)
  end
end
