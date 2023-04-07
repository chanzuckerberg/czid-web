# frozen_string_literal: true

class UpdateBeeHost < ActiveRecord::Migration[6.1]
  def up
    hg = HostGenome.find_by(name: "Bee")
    hg.update(
      s3_star_index_path: "s3://czid-public-references/host_filter/bee/2023-03-31/host-genome-generation-1/bee_STAR_genome.tar",
      s3_bowtie2_index_path: "s3://czid-public-references/host_filter/bee/2023-03-31/host-genome-generation-1/bee.bowtie2.tar",
      s3_minimap2_dna_index_path: "s3://czid-public-references/host_filter/bee/2023-03-31/host-genome-generation-1/bee_dna.mmi",
      s3_minimap2_rna_index_path: "s3://czid-public-references/host_filter/bee/2023-03-31/host-genome-generation-1/bee_rna.mmi"
    )
  end

  def down
    raise ActiveRecord::IrreversibleMigration
  end
end
