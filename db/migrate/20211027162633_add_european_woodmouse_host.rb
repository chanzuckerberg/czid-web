class AddEuropeanWoodmouseHost < ActiveRecord::Migration[6.1]
  def up
    return if HostGenome.find_by(name: "European Woodmouse")

    hg = HostGenome.new
    hg.name = "European Woodmouse"
    hg.s3_star_index_path = "s3://#{S3_DATABASE_BUCKET}/host_filter/european-woodmouse/2021-10-26/european-woodmouse_STAR_genome.tar"
    hg.s3_bowtie2_index_path = "s3://#{S3_DATABASE_BUCKET}/host_filter/european-woodmouse/2021-10-26/european-woodmouse_bowtie2_genome.tar"
    hg.skip_deutero_filter = 0 # this is set to 0 because the host is a deuterostome
    hg.default_background_id = nil
    hg.save!
  end

  def down
    hg = HostGenome.find_by(name: "European Woodmouse")
    hg.destroy! if hg
  end
end
