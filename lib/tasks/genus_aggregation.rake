task genus_aggregation: :environment do
  Sample.all.each do |s|
    pr = s.first_pipeline_run
    next unless pr
    ActiveRecord::Base.transaction do
      TaxonCount.connection.execute(
        "DELETE FROM taxon_counts
         WHERE pipeline_run_id = #{pr.id} AND
               tax_level > #{TaxonCount::TAX_LEVEL_SPECIES}"
      )
      pr.generate_aggregate_counts('genus')
      pr.update_names
      pr.update_genera
      pr.update_is_phage
    end
  end
end
