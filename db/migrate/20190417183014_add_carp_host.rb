class AddCarpHost < ActiveRecord::Migration[5.1]
  def up
    hg = HostGenome.new
    hg.name = "Carp"
    hg.s3_star_index_path = "s3://idseq-database/host_filter/carp/2019-04-17/STAR_genome.tar"
    hg.s3_bowtie2_index_path = "s3://idseq-database/host_filter/carp/2019-04-17/bowtie2_genome.tar"

    human_host = HostGenome.find_by(name: "Human")
    hg.default_background_id = human_host ? human_host.default_background_id : Background.first.id
    hg.save
  end

  def down
    hg = HostGenome.find_by(name: "Carp")
    hg.destroy if hg
  end
end
