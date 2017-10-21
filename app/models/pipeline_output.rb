class PipelineOutput < ApplicationRecord
  belongs_to :sample
  has_many :taxon_counts, dependent: :destroy
  has_many :reports, dependent: :destroy
  has_many :job_stats, dependent: :destroy
  has_and_belongs_to_many :backgrounds
  accepts_nested_attributes_for :taxon_counts
  accepts_nested_attributes_for :job_stats
  belongs_to :pipeline_run

  ANNOTATED_FASTA = 'taxid_annot.fasta'.freeze   ### TO DO: make this file in the pipeline (annotated with taxids not accession ids)
  TAXID_FASTA = 'hits.fasta'.freeze
  LOCAL_FASTA_PATH = '/app/tmp/results_fasta'.freeze

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

  def download_taxid_fasta(taxid)
    input_fasta_s3_path = "#{sample.sample_output_s3_path}/#{ANNOTATED_FASTA}"
    local_fasta_path = "#{LOCAL_FASTA_PATH}/#{id}/#{taxid}"
    local_input = "#{local_fasta_path}/#{ANNOTATED_FASTA}"
    local_output = "#{local_fasta_path}/#{TAXID_FASTA}"
    command = "mkdir -p #{local_fasta_path};"
    command += "aws s3 cp #{input_fasta_s3_path} #{local_fasta_path}/;"
    command += "grep -A 1 -E 'NR:#{taxid}:|NT:#{taxid}:' #{local_input} | sed '/^--$/d' > #{local_output}"
    _stdout, _stderr, status = Open3.capture3(command)
    return nil unless status.exitstatus.zero?
    "#{local_output}"
  end
end
