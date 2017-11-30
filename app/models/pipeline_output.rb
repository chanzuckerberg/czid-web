class PipelineOutput < ApplicationRecord
  belongs_to :sample
  has_many :taxon_counts, dependent: :destroy
  has_many :reports, dependent: :destroy
  has_many :job_stats, dependent: :destroy
  has_many :taxon_byteranges, dependent: :destroy
  has_and_belongs_to_many :backgrounds
  accepts_nested_attributes_for :taxon_counts
  accepts_nested_attributes_for :job_stats
  accepts_nested_attributes_for :taxon_byteranges
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
    # The unctagorizable_name chosen here is not important. The report page
    # endpoint makes its own choice about what to display in this case.  It
    # has general logic to handle this and other undefined cases uniformly.
    # What is crucially important is the uncategorizable_id.
    uncategorizable_id = TaxonLineage::MISSING_LINEAGE_ID.fetch(tax_level_name.to_sym, -9999)
    uncategorizable_name = "Uncategorizable as a #{tax_level_name}"
    TaxonCount.connection.execute(
      "INSERT INTO taxon_counts(pipeline_output_id, tax_id, name,
                                tax_level, count_type, count,
                                percent_identity, alignment_length, e_value, percent_concordant,
                                created_at, updated_at)
       SELECT #{id},
              IF(
                taxon_lineages.#{tax_level_name}_taxid IS NOT NULL,
                taxon_lineages.#{tax_level_name}_taxid,
                #{uncategorizable_id}
              ),
              IF(
                taxon_lineages.#{tax_level_name}_taxid IS NOT NULL,
                taxon_lineages.#{tax_level_name}_name,
                '#{uncategorizable_name}'
              ),
              #{tax_level_id},
              taxon_counts.count_type,
              sum(taxon_counts.count),
              sum(taxon_counts.percent_identity * taxon_counts.count) / sum(taxon_counts.count),
              sum(taxon_counts.alignment_length * taxon_counts.count) / sum(taxon_counts.count),
              sum(taxon_counts.e_value * taxon_counts.count) / sum(taxon_counts.count),
              CASE #{tax_level_id}
                WHEN #{TaxonCount::TAX_LEVEL_SPECIES} THEN taxon_counts.species_total_concordant / sum(taxon_counts.count)
                WHEN #{TaxonCount::TAX_LEVEL_GENUS} THEN taxon_counts.genus_total_concordant / sum(taxon_counts.count)
                WHEN #{TaxonCount::TAX_LEVEL_FAMILY} THEN taxon_counts.family_total_concordant / sum(taxon_counts.count)
              END,
              '#{current_date}',
              '#{current_date}'
       FROM  taxon_lineages, taxon_counts
       WHERE taxon_lineages.taxid = taxon_counts.tax_id AND
             taxon_counts.pipeline_output_id = #{id} AND
             taxon_counts.tax_level = #{TaxonCount::TAX_LEVEL_SPECIES}
      GROUP BY 1,2,3,4,5"
    )
  end

  def update_names
    # The names from the taxon_lineages table are preferred, but, not always
    # available;  this code merges them into taxon_counts.name.
    %w[species genus].each do |level|
      level_id = TaxonCount::NAME_2_LEVEL[level]
      TaxonCount.connection.execute("
        UPDATE taxon_counts, taxon_lineages
        SET taxon_counts.name = taxon_lineages.#{level}_name
        WHERE taxon_counts.pipeline_output_id=#{id} AND
              taxon_counts.tax_level=#{level_id} AND
              taxon_counts.tax_id = taxon_lineages.taxid AND
              taxon_lineages.#{level}_name IS NOT NULL
      ")
    end
  end

  def update_genera
    # Make sure to run update_genera after generate_aggregate_counts
    # HACK This should probably have been accomplished with schema DEFAULTs
    TaxonCount.connection.execute("
      UPDATE taxon_counts
      SET taxon_counts.genus_taxid = #{TaxonLineage::MISSING_GENUS_ID},
          taxon_counts.superkingdom_taxid = #{TaxonLineage::MISSING_SUPERKINGDOM_ID}
      WHERE taxon_counts.pipeline_output_id=#{id}
    ")
    TaxonCount.connection.execute("
      UPDATE taxon_counts, taxon_lineages
      SET taxon_counts.genus_taxid = taxon_lineages.genus_taxid,
          taxon_counts.superkingdom_taxid = taxon_lineages.superkingdom_taxid
      WHERE taxon_counts.pipeline_output_id=#{id} AND
            taxon_lineages.taxid = taxon_counts.tax_id
    ")
  end
end
