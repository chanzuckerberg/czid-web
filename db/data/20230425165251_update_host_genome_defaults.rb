# frozen_string_literal: true

class UpdateHostGenomeDefaults < ActiveRecord::Migration[6.1]
  ERCC_BOWTIE2_INDEX_PATH_V2 = "s3://czid-public-references/host_filter/ercc/20221031/bowtie2_index_tar/ercc.bowtie2.tar"
  ERCC_KALLISTO_INDEX_PATH = "s3://czid-public-references/host_filter/ercc/20221031/kallisto_idx/ercc.kallisto.idx"
  ERCC_HISAT2_INDEX_PATH = "s3://czid-public-references/host_filter/ercc/20221031/hisat2_index_tar/ercc.hisat2.tar"

  def up
    HostGenome.find_each do |hg|
      if hg.s3_bowtie2_index_path_v2.nil?
        hg.s3_bowtie2_index_path_v2 = ERCC_BOWTIE2_INDEX_PATH_V2
      end

      if hg.s3_kallisto_index_path.nil?
        hg.s3_kallisto_index_path = ERCC_KALLISTO_INDEX_PATH
      end

      if hg.s3_hisat2_index_path.nil?
        hg.s3_hisat2_index_path = ERCC_HISAT2_INDEX_PATH
      end

      if hg.changed?
        hg.save!
      end
    end
  end

  def down
    raise ActiveRecord::IrreversibleMigration
  end
end
