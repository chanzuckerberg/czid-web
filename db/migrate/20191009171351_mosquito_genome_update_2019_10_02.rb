class MosquitoGenomeUpdate20191002 < ActiveRecord::Migration[5.1]
  def up
    # The previous mosquito genome was not added via a migration so we need to destroy it
    old_hg = HostGenome.find_by(name: "Mosquito").destroy
    old_hg.destroy if old_hg

    hg.name = "Mosquito"
    hg.s3_star_index_path = "s3://idseq-database/host_filter/mosquitos/2019-10-02/mosquito_STAR_genome.tar"
    hg.s3_bowtie2_index_path = "s3://idseq-database/host_filter/mosquitos/2019-10-02/mosquito_bowtie2_genome.tar"

    human_host = HostGenome.find_by(name: "Human")
    # For lack of a better default, use Human background.
    # In the future, consider asking rabbit users to make a background model
    # from their uninfected samples that we can substitute as the default.
    hg.default_background_id = human_host.default_background_id if human_host
    hg.save
  end

  def down
    hg = HostGenome.find_by(name: "Mosquito").destroy
    hg.destroy if hg
  end
end
