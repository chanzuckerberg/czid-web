class AddSongbirdHost < ActiveRecord::Migration[6.1]
  def up
    return if HostGenome.find_by(name: "Songbird")

    hg = HostGenome.new
    hg.name = "Songbird"
    hg.s3_star_index_path = "s3://#{S3_DATABASE_BUCKET}/host_filter/songbird/2021-08-02/songbird_STAR_genome.tar"
    hg.s3_bowtie2_index_path = "s3://#{S3_DATABASE_BUCKET}/host_filter/songbird/2021-08-02/songbird_bowtie2_genome.tar"
    hg.skip_deutero_filter = 0 # this is set to 0 because the host is a deuterostome

    human_host = HostGenome.find_by(name: "Human")
    hg.default_background_id = human_host.default_background_id if human_host
    hg.save!
  end

  def down
    hg = HostGenome.find_by(name: "Songbird")
    hg.destroy! if hg
  end
end
