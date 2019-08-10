class SetDeuteroFlag < ActiveRecord::Migration[5.1]
  def change
    HostGenome.where(name: ["Tick", "ERCC only", "C.elegans", "Bee", "Salpingoeca rosetta"]).update_all(skip_deutero_filter: 1) # rubocop:disable Rails/SkipsModelValidations
  end
end
