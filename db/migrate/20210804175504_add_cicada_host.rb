class AddCicadaHost < ActiveRecord::Migration[6.1]
  def up
    return if HostGenome.find_by(name: "Cicada")

    hg = HostGenome.new
    hg.name = "Cicada"
    hg.s3_star_index_path = "s3://#{S3_DATABASE_BUCKET}/host_filter/cicada/2021-07-28/cicada_STAR_genome.tar"
    hg.s3_bowtie2_index_path = "s3://#{S3_DATABASE_BUCKET}/host_filter/cicada/2021-07-28/cicada_bowtie2_genome.tar"
    hg.skip_deutero_filter = 1 # this is set to 1 because the host is NOT a deuterostome

    human_host = HostGenome.find_by(name: "Human")
    hg.default_background_id = human_host.default_background_id if human_host
    hg.save!
  end

  def down
    hg = HostGenome.find_by(name: "Cicada")
    hg.destroy! if hg
  end
end
