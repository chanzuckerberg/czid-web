# WARNING: Since the contigs table is so large, this data migration may take a long time to run.
BATCH_SIZE = 10_000

# This code assumes that no one tries to delete contigs (via deleting samples) during this migration.
# If a sample is deleted, there is a chance the migration will crash (it depends on how robust active-import is)
class PopulateContigSpeciesTaxids
  @queue = :data_migration
  def self.perform
    start_time = Time.now.to_f

    # Just select the columns that we need. In particular, don't select the sequence column, which is very large.
    contigs_to_update = Contig.where(species_taxid_nt: nil, species_taxid_nr: nil).select(:id, :lineage_json)

    total_updated = 0
    failed_ids = []
    Rails.logger.info("populate_contig_species_taxids: Starting data migration.")

    # Process the contigs in batches so we don't need to load everything into RAM at once.
    contigs_to_update.find_in_batches(batch_size: BATCH_SIZE) do |contigs|
      contigs.each do |contig|
        if contig.lineage_json.present?
          lineage_json = JSON.parse(contig.lineage_json)
          contig.species_taxid_nt = lineage_json.dig("NT", 0) || nil
          contig.species_taxid_nr = lineage_json.dig("NR", 0) || nil
          contig.genus_taxid_nt = lineage_json.dig("NT", 1) || nil
          contig.genus_taxid_nr = lineage_json.dig("NR", 1) || nil
        end
      rescue StandardError => e
        Rails.logger.error(e)
        failed_ids << contig.id
      end

      # Use active-import to update multiple contigs in one query.
      # Just update the taxid fields.
      results = Contig.bulk_import(contigs, validate: false, on_duplicate_key_update: [:species_taxid_nt, :species_taxid_nr, :genus_taxid_nt, :genus_taxid_nr])
      results.failed_instances.each do |contig|
        Rails.logger.error("Contig ID #{contig.id} failed to save. species_taxid_nt #{contig.species_taxid_nt}, species_taxid_nr #{contig.species_taxid_nr}")
        failed_ids << contig.id
      end

      total_updated += contigs.length

      # Regularly log progress updates.
      if total_updated % 100_000 == 0
        Rails.logger.info("populate_contig_species_taxids: #{total_updated} contigs processed...")
      end
    end

    unless failed_ids.empty?
      Rails.logger.info("#{failed_ids.length} failed ids: #{failed_ids}")
    end
    Rails.logger.info(format("Updated %d rows in %3.1f seconds", total_updated, (Time.now.to_f - start_time)))
  rescue StandardError => e
    # Eventually, this data migration may no longer be compatible with the database.
    Rails.logger.error(e)
    Rails.logger.error("populate_contig_species_taxids failed. This data migration may be out of date with the db schema. Consider deleting.")
  end
end
