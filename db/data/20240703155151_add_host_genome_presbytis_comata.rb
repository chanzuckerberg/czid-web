# frozen_string_literal: true

# Generated by https://github.com/chanzuckerberg/idseq/blob/main/scripts/generate_host_genome.py

class AddHostGenomePresbytisComata < ActiveRecord::Migration[6.1]
  def up
    return if HostGenome.find_by(name: "Presbytis comata - grizzled leaf monkey")

    hg = HostGenome.new
    hg.name = "Presbytis comata - grizzled leaf monkey"
    hg.s3_star_index_path = "s3://#{S3_DATABASE_BUCKET}/host_filter/presbytis_comata/2024-07-03/host-genome-generation-1/presbytis_comata_STAR_genome.tar"
    hg.s3_bowtie2_index_path = "s3://#{S3_DATABASE_BUCKET}/host_filter/presbytis_comata/2024-07-03/host-genome-generation-1/presbytis_comata.bowtie2.tar"
    hg.s3_minimap2_dna_index_path = "s3://#{S3_DATABASE_BUCKET}/host_filter/presbytis_comata/2024-07-03/host-genome-generation-1/presbytis_comata_dna.mmi"
    hg.s3_minimap2_rna_index_path = "s3://#{S3_DATABASE_BUCKET}/host_filter/presbytis_comata/2024-07-03/host-genome-generation-1/presbytis_comata_rna.mmi"
    hg.s3_hisat2_index_path = "s3://#{S3_DATABASE_BUCKET}/host_filter/presbytis_comata/2024-07-03/host-genome-generation-1/presbytis_comata.hisat2.tar"
    hg.s3_kallisto_index_path = "s3://#{S3_DATABASE_BUCKET}/host_filter/presbytis_comata/2024-07-03/host-genome-generation-1/presbytis_comata.kallisto.idx"
    hg.s3_bowtie2_index_path_v2 = "s3://#{S3_DATABASE_BUCKET}/host_filter/presbytis_comata/2024-07-03/host-genome-generation-1/presbytis_comata.bowtie2.tar"
    hg.skip_deutero_filter = 1 # this is set to 1 because the host is a deuterostome

    hg.default_background_id = nil
    hg.save!
  end

  def down
    hg = HostGenome.find_by(name: "Presbytis comata - grizzled leaf monkey")
    hg.destroy! if hg
  end
end