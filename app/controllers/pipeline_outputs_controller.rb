class PipelineOutputsController < ApplicationController
  include ReportHelper
  include PipelineOutputsHelper
  before_action :set_pipeline_output, only: [:show, :show_taxid_fasta, :send_nonhost_fasta, :send_unidentified_fasta]
  before_action :typed_counts, only: [:show]

  protect_from_forgery unless: -> { request.format.json? }

  # GET /pipeline_outputs
  # GET /pipeline_outputs.json
  def index
    @pipeline_outputs = PipelineOutput.all
  end

  # GET /pipeline_outputs/1
  # GET /pipeline_outputs/1.json
  def show
  end


  private

  # Use callbacks to share common setup or constraints between actions.
  def set_pipeline_output
    @pipeline_output = PipelineOutput.find(params[:id])
  end

  def typed_counts
    counts = @pipeline_output.taxon_counts
    @nt_species_counts = counts.type('NT').level(TaxonCount::TAX_LEVEL_SPECIES)
    @nr_species_counts = counts.type('NR').level(TaxonCount::TAX_LEVEL_SPECIES)
    @ordered_nt_species_tax_ids = @nt_species_counts.order(count: :desc).where.not("tax_id < 0").map(&:tax_id)
    @ordered_nr_species_tax_ids = @nr_species_counts.order(count: :desc).where.not("tax_id < 0").map(&:tax_id)
    @ordered_species_tax_ids = (@ordered_nt_species_tax_ids + @ordered_nr_species_tax_ids).uniq
    @nt_genus_counts = counts.type('NT').level(TaxonCount::TAX_LEVEL_GENUS)
    @nr_genus_counts = counts.type('NR').level(TaxonCount::TAX_LEVEL_GENUS)
    @ordered_nt_genus_tax_ids = @nt_genus_counts.order(count: :desc).where.not("tax_id < 0").map(&:tax_id)
    @ordered_nr_genus_tax_ids = @nr_genus_counts.order(count: :desc).where.not("tax_id < 0").map(&:tax_id)
    @ordered_genus_tax_ids = (@ordered_nt_genus_tax_ids + @ordered_nr_genus_tax_ids).uniq
  end

  # Never trust parameters from the scary internet, only allow the white list through.
  def pipeline_output_params
    params.require(:pipeline_output).permit(:sample_id, :name, :total_reads, :remaining_reads,
                                            taxon_counts_attributes: [:tax_id, :tax_level, :count, :name, :count_type],
                                            job_stats_attributes: [:task, :reads_before, :reads_after])
  end
end
