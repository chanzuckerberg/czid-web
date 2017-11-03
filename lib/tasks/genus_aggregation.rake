task genus_aggregation: :environment do
  PipelineOutput.all.each do |po|
    ActiveRecord::Base.transaction do
      TaxonCount.connection.execute(
        "DELETE FROM taxon_counts
         WHERE pipeline_output_id = #{po.id} AND
               tax_level > #{TaxonCount::TAX_LEVEL_SPECIES}"
      )
      po.generate_aggregate_counts('genus')
      po.update_names
    end
  end
end
