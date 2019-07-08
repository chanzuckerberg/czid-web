class AddBatHost < ActiveRecord::Migration[5.1]
  def up
    return if HostGenome.find_by(name: "Bat")

    hg = HostGenome.new
    hg.name = "Bat"
    hg.s3_star_index_path = "s3://idseq-database/host_filter/bat/2019-07-02/bat_STAR_genome.tar"
    hg.s3_bowtie2_index_path = "s3://idseq-database/host_filter/bat/2019-07-02/bat_bowtie2_genome.tar"

    human_host = HostGenome.find_by(name: "Human")
    hg.default_background_id = human_host.default_background_id if human_host
    hg.save
  end

  def down
    hg = HostGenome.find_by(name: "Bat")
    hg.destroy if hg
  end
end
