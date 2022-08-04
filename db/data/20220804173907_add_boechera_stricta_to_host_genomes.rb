# frozen_string_literal: true

class AddBoecheraStrictaToHostGenomes < ActiveRecord::Migration[6.1]
  def up
    return if HostGenome.find_by(name: "Boechera Stricta")

    hg = HostGenome.new
    hg.name = "Boechera Stricta"
    hg.s3_star_index_path = "s3://czid-public-references/host_filter/boechera_stricta/2022-07-29/host-genome-generation-0/boechera_stricta_STAR_genome.tar"
    hg.s3_bowtie2_index_path = "s3://czid-public-references/host_filter/boechera_stricta/2022-07-29/host-genome-generation-0/boechera_stricta_bowtie2_genome.tar"

    human_host = HostGenome.find_by(name: "Boechera Stricta")
    # For lack of a better default, use Human background.
    # In the future, consider asking bee users to make a background model
    # from their uninfected samples that we can substitute as the default.
    hg.default_background_id = human_host.default_background_id if human_host
    hg.save
  end

  def down
    hg = HostGenome.find_by(name: "Boechera Stricta")
    hg.destroy if hg
  end
end
