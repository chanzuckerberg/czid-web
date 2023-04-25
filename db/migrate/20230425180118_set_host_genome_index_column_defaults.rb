class SetHostGenomeIndexColumnDefaults < ActiveRecord::Migration[6.1]
  ERCC_BOWTIE2_INDEX_PATH_V2 = "s3://czid-public-references/host_filter/ercc/20221031/bowtie2_index_tar/ercc.bowtie2.tar".freeze
  ERCC_KALLISTO_INDEX_PATH = "s3://czid-public-references/host_filter/ercc/20221031/kallisto_idx/ercc.kallisto.idx".freeze
  ERCC_HISAT2_INDEX_PATH = "s3://czid-public-references/host_filter/ercc/20221031/hisat2_index_tar/ercc.hisat2.tar".freeze

  def change
    # Default to the ERCC index paths for new host genomes that don't have these indexes specified
    change_column :host_genomes, :s3_bowtie2_index_path_v2, :string, default: ERCC_BOWTIE2_INDEX_PATH_V2
    change_column :host_genomes, :s3_hisat2_index_path, :string, default: ERCC_HISAT2_INDEX_PATH
    change_column :host_genomes, :s3_kallisto_index_path, :string, default: ERCC_KALLISTO_INDEX_PATH
  end
end
