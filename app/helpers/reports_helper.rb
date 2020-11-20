module ReportsHelper
  # For taxon_count 'species' rows without a corresponding 'genus' rows,
  # we create a fake singleton genus containing just that species;
  # the fake genus IDs start here:
  FAKE_GENUS_BASE = -1_900_000_000

  def self.validate_names(counts, lineage_by_tax_id, pipeline_run_id)
    # This makes up suitable names for missing and blacklisted genera and species. Such
    # made-up names should be lowercase so they are sorted below proper names.
    missing_names = Set.new
    missing_parents = {}

    # Iterate through both species and genus.
    counts.each do |tax_level, tax_counts|
      tax_counts.each do |tax_id, tax_info|
        validated_tax_name, missing_report = ReportsHelper.validate_name(
          tax_id: tax_id,
          tax_level: tax_level,
          tax_name: tax_info[:name],
          genus_tax_id: tax_info[:genus_tax_id],
          parent_name: fetch_parent_name(tax_level, tax_id, tax_info, lineage_by_tax_id),
          pipeline_run_id: pipeline_run_id
        )
        tax_info[:name] = validated_tax_name if validated_tax_name

        if missing_report.present?
          missing_parents[missing_report[:parent]] = tax_id if missing_report[:parent]
          missing_names.add(tax_id) if missing_report[:name]
        end
      end
    end

    Rails.logger.warn "Pipeline run #{pipeline_run_id} missing names for taxon ids #{missing_names.to_a}" unless missing_names.empty?
    Rails.logger.warn "Pipeline run #{pipeline_run_id} missing parent for child:  #{missing_parents}" unless missing_parents.empty?
  end

  def self.validate_name(tax_id:, tax_level:, tax_name:, genus_tax_id:, parent_name:, pipeline_run_id:)
    genus_str = TaxonLineage.level_name(TaxonCount::TAX_LEVEL_GENUS)
    family_str = TaxonLineage.level_name(TaxonCount::TAX_LEVEL_FAMILY)

    level_str = TaxonLineage.level_name(tax_level)
    missing = {}
    if tax_id < 0
      # Usually -1 means accession number did not resolve to species.
      # TODO: Can we keep the accession numbers to show in these cases?
      # NOTE: important to be lowercase for sorting below uppercase valid genuses
      validated_tax_name = "all taxa with neither family nor genus classification"

      if tax_id < TaxonLineage::INVALID_CALL_BASE_ID
        parent_level = tax_level == TaxonCount::TAX_LEVEL_SPECIES ? genus_str : family_str
        parent_tax_id = tax_level == TaxonCount::TAX_LEVEL_SPECIES ? genus_tax_id : convert_neg_taxid(tax_id)
        # If no parent (genus/family) name was found, then use the parent id as the name.
        unless parent_name
          missing[:parent] = parent_tax_id
          parent_name = "taxon #{parent_tax_id}"
        end
        validated_tax_name = "non-#{level_str}-specific reads in #{parent_level} #{parent_name}"
        Rails.logger.info("Pipeline run #{pipeline_run_id} contains non-#{level_str}-specific reads in #{parent_level} #{parent_name}")

      elsif tax_id == TaxonLineage::BLACKLIST_GENUS_ID
        validated_tax_name = "all artificial constructs"
        Rails.logger.info("Blacklisted genus id appeared in report for pipeline run #{pipeline_run_id}.")

      elsif !TaxonLineage::MISSING_LINEAGE_ID.value?(tax_id) && tax_id != TaxonLineage::MISSING_SPECIES_ID_ALT
        validated_tax_name += " #{tax_id}"
        Rails.logger.info("Pipeline run #{pipeline_run_id} missing lineage for #{tax_id}.")
      end

    elsif !tax_name
      missing[:name] = tax_id
      validated_tax_name = "unnamed #{level_str} taxon #{tax_id}"
    end

    return validated_tax_name, missing
  end

  def self.convert_neg_taxid(tax_id)
    thres = TaxonLineage::INVALID_CALL_BASE_ID
    if tax_id < thres
      tax_id = -(tax_id % thres).to_i
    end
    tax_id
  end

  def self.fetch_parent_name(tax_level, tax_id, tax_info, lineage_by_tax_id)
    if tax_level == TaxonCount::TAX_LEVEL_SPECIES
      parent_name = lineage_by_tax_id[tax_info[:genus_tax_id]]["genus_name"] if lineage_by_tax_id[tax_info[:genus_tax_id]]
    else
      lineage_id_by_species = lineage_by_tax_id.keys & tax_info[:species_tax_ids]
      parent_name = if lineage_by_tax_id[tax_id]
                      lineage_by_tax_id[tax_id]["family_name"]
                    # If genus id is undefined, then find taxon lineage by species id instead.
                    elsif !lineage_id_by_species.empty?
                      lineage_by_tax_id[lineage_id_by_species[0]]["family_name"]
                    end
    end
    parent_name
  end

  def self.cleanup_missing_genus_counts(species_counts, genus_counts)
    # there should be a genus_pair for every species (even if it is the pseudo
    # genus id -200);  anything else indicates a bug in data import;
    # warn and ensure affected data is NOT hidden from view
    fake_genera = []
    missing_genera = Set.new
    taxids_with_missing_genera = Set.new
    species_counts.each do |tax_id, tax_info|
      genus_tax_id = tax_info[:genus_tax_id]
      unless genus_counts[genus_tax_id]
        taxids_with_missing_genera.add(tax_id)
        missing_genera.add(genus_tax_id)
        fake_genera << fake_genus(tax_id, tax_info)
      end
    end
    Rails.logger.warn "Missing taxon_counts for genus ids #{missing_genera.to_a} corresponding to taxon ids #{taxids_with_missing_genera.to_a}." unless missing_genera.empty?
    fake_genera.each do |fake_genus_info|
      genus_counts[fake_genus_info[:genus_tax_id]] = fake_genus_info
    end
  end

  def self.fake_genus(tax_id, tax_info)
    fake_genus_info = tax_info.clone
    fake_genus_info[:name] = tax_info[:name] ? "Ad hoc bucket for #{tax_info[:name].downcase}" : "Ad hoc bucket for #{tax_id}"
    fake_genus_id = FAKE_GENUS_BASE - tax_id
    fake_genus_info[:genus_tax_id] = fake_genus_id
    fake_genus_info[:tax_level] = TaxonCount::TAX_LEVEL_GENUS
    tax_info[:genus_tax_id] = fake_genus_id
    fake_genus_info
  end
end
