# frozen_string_literal: true

class AddPeaAphidHost < ActiveRecord::Migration[6.1]
  def up
    return if HostGenome.find_by(name: "Pea Aphid")

    date_created = "2022-12-02"
    s3_name = "pea-aphid"
    hg = HostGenome.new
    hg.name = "Pea Aphid"
    hg.s3_star_index_path = "s3://#{S3_DATABASE_BUCKET}/host_filter/#{s3_name}/#{date_created}/#{s3_name}_STAR_genome.tar"
    hg.s3_bowtie2_index_path = "s3://#{S3_DATABASE_BUCKET}/host_filter/#{s3_name}/#{date_created}/#{s3_name.gsub("-", "_")}_bowtie2_genome.tar"
    hg.s3_minimap2_dna_index_path = "s3://#{S3_DATABASE_BUCKET}/host_filter/#{s3_name}/#{date_created}/#{s3_name.gsub("-", "_")}_minimap2_genome_dna.mmi" if hg.has_attribute?("s3_minimap2_dna_index_path")
    hg.s3_minimap2_rna_index_path = "s3://#{S3_DATABASE_BUCKET}/host_filter/#{s3_name}/#{date_created}/#{s3_name.gsub("-", "_")}_minimap2_genome_rna.mmi" if hg.has_attribute?("s3_minimap2_rna_index_path")
    hg.skip_deutero_filter = 0 # this is set to 0 because the host is a deuterostome
    hg.default_background_id = nil
    hg.save!
  end

  def down
    hg = HostGenome.find_by(name: "Pea Aphid")
    hg.destroy! if hg
  end
end
