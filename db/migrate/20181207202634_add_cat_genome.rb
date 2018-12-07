class AddCatGenome < ActiveRecord::Migration[5.1]
  def up
    hg = HostGenome.new
    hg.name = "Cat"
    hg.s3_star_index_path = "s3://idseq-database/host_filter/cat/2018-12-04-utc-1543964501-unixtime__2018-12-04-utc-1543964501-unixtime/STAR_genome.tar"
    hg.s3_bowtie2_index_path = "s3://idseq-database/host_filter/cat/2018-12-04-utc-1543964501-unixtime__2018-12-04-utc-1543964501-unixtime/bowtie2_genome.tar"

    bg_id = if HostGenome.find_by(name: "Mouse")
              HostGenome.find_by(name: "Mouse").default_background_id
            else
              HostGenome.find_by(name: "Human").default_background_id
            end
    hg.default_background_id = bg_id
    hg.sample_memory = 60_000
    hg.save
  end

  def down
    if HostGenome.find_by(name: "Cat")
      HostGenome.find_by(name: "Cat").destroy
    end
  end
end
