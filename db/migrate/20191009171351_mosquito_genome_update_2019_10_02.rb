class MosquitoGenomeUpdate20191002 < ActiveRecord::Migration[5.1]
  def up
    hg = HostGenome.find_by(name: "Mosquito")
    return unless hg
    hg.s3_star_index_path = "s3://idseq-database/host_filter/mosquitos/2019-10-02/mosquito_STAR_genome.tar"
    hg.s3_bowtie2_index_path = "s3://idseq-database/host_filter/mosquitos/2019-10-02/mosquito_bowtie2_genome.tar"
    hg.save
  end
end
