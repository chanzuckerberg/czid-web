class CreateRpmColumnOnTaxonCounts < ActiveRecord::Migration[6.1]
  def change
    add_column :taxon_counts, :rpm, :float, comment: "Number of reads aligning to the taxon in the NCBI NR/NT database, per million reads sequenced."
  end
end
