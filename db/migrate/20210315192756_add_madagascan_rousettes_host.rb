class AddMadagascanRousettesHost < ActiveRecord::Migration[5.2]
  def up
    hg = HostGenome.find_by(name: "Madagascan Rousettes")
    hg ||= HostGenome.new
    hg.name = "Madagascan Rousettes"
    hg.s3_star_index_path = "s3://#{S3_DATABASE_BUCKET}/host_filter/madagascan_rousettes/2021-03-05/madagascan_rousettes_STAR_genome.tar"
    hg.s3_bowtie2_index_path = "s3://#{S3_DATABASE_BUCKET}/host_filter/madagascan_rousettes/2021-03-05/madagascan_rousettes_bowtie2_genome.tar"
    hg.skip_deutero_filter = 0

    human_host = HostGenome.find_by(name: "Human")
    # For lack of a better default, use Human background.
    # In the future, consider asking madagascan rousettes users to make a background model
    # from their uninfected samples that we can substitute as the default.
    hg.default_background_id = human_host.default_background_id if human_host
    hg.save
  end

  def down
    hg = HostGenome.find_by(name: "Madagascan Rousettes")
    hg.destroy if hg
  end
end
