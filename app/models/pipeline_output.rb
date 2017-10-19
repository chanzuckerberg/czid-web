class PipelineOutput < ApplicationRecord
  belongs_to :sample
  has_many :taxon_counts, dependent: :destroy
  has_many :reports, dependent: :destroy
  has_many :job_stats, dependent: :destroy
  has_and_belongs_to_many :backgrounds
  accepts_nested_attributes_for :taxon_counts
  accepts_nested_attributes_for :job_stats
  belongs_to :pipeline_run
  def name
    ['ID#', id, ' (', sample.name, ')'].join('')
  end

  def generate_report
    if sample.host_genome && sample.host_genome.default_background
      Report.create(name: "#{sample.id}: #{sample.name}",
                    pipeline_output: self,
                    background: sample.host_genome.default_background)

    end
  end

  def generate_aggregate_counts(tax_level_name)
    current_date = Time.zone.now.strftime("%Y-%m-%d")
    tax_level_id = TaxonCount::NAME_2_LEVEL[tax_level_name]
    # TODO(yf): take into account the case when tax_id doesn't appear in the taxon_lineages table
    TaxonCount.connection.execute(
      "INSERT INTO taxon_counts(pipeline_output_id, tax_id, name,
                                tax_level, count_type, count, created_at, updated_at)
       SELECT #{id}, taxon_lineages.#{tax_level_name}_taxid, taxon_lineages.#{tax_level_name}_name,
              #{tax_level_id}, taxon_counts.count_type,
              sum(taxon_counts.count), '#{current_date}', '#{current_date}'
       FROM  taxon_lineages, taxon_counts
       WHERE taxon_lineages.taxid = taxon_counts.tax_id AND
             taxon_counts.pipeline_output_id = #{id} AND
             taxon_counts.tax_level = #{TaxonCount::TAX_LEVEL_SPECIES}
      GROUP BY 1,2,3,4,5"
    )
  end
end
