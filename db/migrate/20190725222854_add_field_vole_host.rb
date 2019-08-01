class AddFieldVoleHost < ActiveRecord::Migration[5.1]
  def up
    return if HostGenome.find_by(name: "Field Vole")

    hg = HostGenome.new
    hg.name = "Field Vole"
    hg.s3_star_index_path = "s3://idseq-database/host_filter/field_vole/2019-07-24/field_vole_STAR_genome.tar"
    hg.s3_bowtie2_index_path = "s3://idseq-database/host_filter/field_vole/2019-07-24/field_vole_bowtie2_genome.tar"

    human_host = HostGenome.find_by(name: "Human")
    # For lack of a better default, use Human background.
    # In the future, consider asking field_vole users to make a background model
    # from their uninfected samples that we can substitute as the default.
    hg.default_background_id = human_host.default_background_id if human_host
    hg.save
  end

  def down
    hg = HostGenome.find_by(name: "Field Vole")
    hg.destroy if hg
  end
end
