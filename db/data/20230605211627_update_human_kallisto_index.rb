# frozen_string_literal: true

class UpdateHumanKallistoIndex < ActiveRecord::Migration[6.1]
  HUMAN_KALLISTO_INDEX_PATH = "s3://czid-public-references/host_filter/human/20230601/kallisto_idx/human.kallisto.idx"

  def up
    hg = HostGenome.find_by(name: "Human")
    hg.s3_kallisto_index_path = HUMAN_KALLISTO_INDEX_PATH
    hg.save!
  end

  def down
    raise ActiveRecord::IrreversibleMigration
  end
end
