class AddNewGenomes < ActiveRecord::Migration[5.1]
  def up
    # Zendesk ticket: https://chanzuckerberg.zendesk.com/agent/tickets/6193

    # For lack of a better default, use Human background.
    # In the future, consider asking users to make a background model
    # from their uninfected samples that we can substitute as the default.
    human_host = HostGenome.find_by(name: "Human")
    human_background = human_host ? human_host.default_background_id : nil

    unless HostGenome.find_by(name: "Water Buffalo")
      hg = HostGenome.new(
        name: "Water Buffalo",
        s3_star_index_path: "s3://idseq-database/host_filter/water_buffalo/2019-09-30/water_buffalo_STAR_genome.tar",
        s3_bowtie2_index_path: "s3://idseq-database/host_filter/water_buffalo/2019-09-30/water_buffalo_bowtie2_genome.tar",
        skip_deutero_filter: nil,
        default_background_id: human_background
      )
      hg.save
    end

    unless HostGenome.find_by(name: "Horse")
      hg = HostGenome.new(
        name: "Horse",
        s3_star_index_path: "s3://idseq-database/host_filter/horse/2019-09-30/horse_STAR_genome.tar",
        s3_bowtie2_index_path: "s3://idseq-database/host_filter/horse/2019-09-30/horse_bowtie2_genome.tar",
        skip_deutero_filter: nil,
        default_background_id: human_background
      )
      hg.save
    end

    unless HostGenome.find_by(name: "Taurine Cattle")
      hg = HostGenome.new(
        name: "Taurine Cattle",
        s3_star_index_path: "s3://idseq-database/host_filter/taurine_cattle/2019-09-30/taurine_cattle_STAR_genome.tar",
        s3_bowtie2_index_path: "s3://idseq-database/host_filter/taurine_cattle/2019-09-30/taurine_cattle_bowtie2_genome.tar",
        skip_deutero_filter: nil,
        default_background_id: human_background
      )
      hg.save
    end

    unless HostGenome.find_by(name: "Turkey")
      hg = HostGenome.new(
        name: "Turkey",
        s3_star_index_path: "s3://idseq-database/host_filter/turkey/2019-09-30/turkey_STAR_genome.tar",
        s3_bowtie2_index_path: "s3://idseq-database/host_filter/turkey/2019-09-30/turkey_bowtie2_genome.tar",
        skip_deutero_filter: nil,
        default_background_id: human_background
      )
      hg.save
    end
  end

  def down
    hg = HostGenome.find_by(name: "Water Buffalo")
    hg.destroy if hg

    hg = HostGenome.find_by(name: "Horse")
    hg.destroy if hg

    hg = HostGenome.find_by(name: "Taurine Cattle")
    hg.destroy if hg

    hg = HostGenome.find_by(name: "Turkey")
    hg.destroy if hg
  end
end
