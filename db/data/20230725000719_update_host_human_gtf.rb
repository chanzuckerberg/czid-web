# frozen_string_literal: true

class UpdateHostHumanGtf < ActiveRecord::Migration[6.1]
  # This matches the GENCODE v43 version we used for creating Kallisto index
  CURRENT_HUMAN_GTF_S3_PATH = "s3://czid-public-references/host_filter/human/20230601/original_transcripts_gtf_gz/gencode.v43.annotation.gtf.gz"

  def up
    hg = HostGenome.find_by(name: "Human")
    hg.s3_original_transcripts_gtf_index_path = CURRENT_HUMAN_GTF_S3_PATH
    hg.save!
  end

  def down
    raise ActiveRecord::IrreversibleMigration
  end
end
