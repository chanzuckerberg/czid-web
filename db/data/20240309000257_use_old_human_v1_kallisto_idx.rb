# frozen_string_literal: true

class UseOldHumanV1KallistoIdx < ActiveRecord::Migration[6.1]
  def up
    human_v1 = HostGenome.find_by(name: "Human", version: 1)
    human_v2 = HostGenome.find_by(name: "Human", version: 2)
    # Should be guaranteed we have both v1 and v2, but if not, abandon ship.
    return unless human_v1 and human_v2

    human_v2.s3_kallisto_index_path = human_v1.s3_kallisto_index_path
    human_v2.save!
  end

  def down
    raise ActiveRecord::IrreversibleMigration
  end
end
