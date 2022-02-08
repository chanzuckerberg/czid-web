class AddSoybeanHost < ActiveRecord::Migration[6.1]
  def up
    return if HostGenome.find_by(name: "Soybean")

    hg = HostGenome.new
    hg.name = "Soybean"
    hg.s3_star_index_path = "s3://#{S3_DATABASE_BUCKET}/host_filter/soybean/2022-02-07/soybean_STAR_genome.tar"
    hg.s3_bowtie2_index_path = "s3://#{S3_DATABASE_BUCKET}/host_filter/soybean/2022-02-07/soybean_bowtie2_genome.tar"
    hg.skip_deutero_filter = 1 # this is set to 1 because the host is not a deuterostome

    hg.default_background_id = nil
    hg.save!
  end

  def down
    hg = HostGenome.find_by(name: "Soybean")
    hg.destroy! if hg
  end
end
