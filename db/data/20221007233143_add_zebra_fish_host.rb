# frozen_string_literal: true

class AddZebraFishHost < ActiveRecord::Migration[6.1]
  def up
    return if HostGenome.find_by(name: "Large Japanese Fieldmouse")

    hg = HostGenome.new
    hg.name = "Zebra Fish"
    hg.s3_star_index_path = "s3://#{S3_DATABASE_BUCKET}/host_filter/zebra_fish/2022-10-07/host-genome-generation-0/zebra_fish_STAR_genome.tar"
    hg.s3_bowtie2_index_path = "s3://#{S3_DATABASE_BUCKET}/host_filter/zebra_fish/2022-10-07/host-genome-generation-0/zebra_fish_bowtie2_genome.tar"
    hg.skip_deutero_filter = 0 # this is set to 0 because the host is a deuterostome

    hg.default_background_id = nil
    hg.save!
  end

  def down
    hg = HostGenome.find_by(name: "Zebra Fish")
    hg.destroy! if hg
  end
end
