class AddFishGenomes < ActiveRecord::Migration[5.1]
  def up
    # JIRA: https://jira.czi.team/browse/IDSEQ-1952

    # For lack of a better default, use Human background.
    # In the future, consider asking users to make a background model
    # from their uninfected samples that we can substitute as the default.
    human_host = HostGenome.find_by(name: "Human")
    human_background = human_host ? human_host.default_background_id : nil

    unless HostGenome.find_by(name: "Barred Hamlet")
      hg = HostGenome.new(
        name: "Barred Hamlet",
        s3_star_index_path: "s3://idseq-database/host_filter/barred_hamlet/2019-12-17/barred_hamlet_STAR_genome.tar	",
        s3_bowtie2_index_path: "s3://idseq-database/host_filter/barred_hamlet/2019-12-17/barred_hamlet_bowtie2_genome.tar",
        skip_deutero_filter: nil,
        default_background_id: human_background
      )
      hg.save
    end

    unless HostGenome.find_by(name: "Orange Clownfish")
      hg = HostGenome.new(
        name: "Orange Clownfish",
        s3_star_index_path: "s3://idseq-database/host_filter/orange_clownfish/2019-12-17/orange_clownfish_STAR_genome.tar",
        s3_bowtie2_index_path: "s3://idseq-database/host_filter/orange_clownfish/2019-12-17/orange_clownfish_bowtie2_genome.tar",
        skip_deutero_filter: nil,
        default_background_id: human_background
      )
      hg.save
    end

    unless HostGenome.find_by(name: "Tiger Tail Seahorse")
      hg = HostGenome.new(
        name: "Tiger Tail Seahorse",
        s3_star_index_path: "s3://idseq-database/host_filter/tiger_tail_seahorse/2019-12-17/tiger_tail_seahorse_STAR_genome.tar	",
        s3_bowtie2_index_path: "s3://idseq-database/host_filter/tiger_tail_seahorse/2019-12-17/tiger_tail_seahorse_bowtie2_genome.tar	",
        skip_deutero_filter: nil,
        default_background_id: human_background
      )
      hg.save
    end

    unless HostGenome.find_by(name: "Torafugu")
      hg = HostGenome.new(
        name: "Torafugu",
        s3_star_index_path: "s3://idseq-database/host_filter/torafugu/2019-12-17/torafugu_STAR_genome.tar",
        s3_bowtie2_index_path: "s3://idseq-database/host_filter/torafugu/2019-12-17/torafugu_bowtie2_genome.tar	",
        skip_deutero_filter: nil,
        default_background_id: human_background
      )
      hg.save
    end
  end

  def down
    hg = HostGenome.find_by(name: "Barred Hamlet")
    hg.destroy if hg

    hg = HostGenome.find_by(name: "Orange Clownfish")
    hg.destroy if hg

    hg = HostGenome.find_by(name: "Tiger Tail Seahorse")
    hg.destroy if hg

    hg = HostGenome.find_by(name: "Torafugu")
    hg.destroy if hg
  end
end
