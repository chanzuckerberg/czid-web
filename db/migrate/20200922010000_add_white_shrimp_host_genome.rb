class AddWhiteShrimpHostGenome < ActiveRecord::Migration[5.1]
  def up
    # Clubhouse ticket: https://app.clubhouse.io/idseq/story/27081

    # For lack of a better default, use Human background.
    # In the future, consider asking users to make a background model
    # from their uninfected samples that we can substitute as the default.
    human_host = HostGenome.find_by(name: "Human")
    human_background = human_host ? human_host.default_background_id : nil

    HostGenome.reset_column_information

    unless HostGenome.find_by(name: "White Shrimp")
      hg = HostGenome.new(
        name: "White Shrimp",
        s3_star_index_path: "s3://idseq-public-references/host_filter/white_shrimp/2020-09-22/white_shrimp_STAR_genome.tar",
        s3_bowtie2_index_path: "s3://idseq-public-references/host_filter/white_shrimp/2020-09-22/white_shrimp_bowtie2_genome.tar",
        skip_deutero_filter: 0,
        default_background_id: human_background,
        taxa_category: "non-human-animal"
      )
      hg.save!
    end
  end

  def down
    hg = HostGenome.find_by(name: "White Shrimp")
    hg.destroy if hg
  end
end
