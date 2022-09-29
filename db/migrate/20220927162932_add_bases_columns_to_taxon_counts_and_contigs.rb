class AddBasesColumnsToTaxonCountsAndContigs < ActiveRecord::Migration[6.1]
  def change
    add_column :taxon_counts, :base_count, :integer, comment: "Number of bases aligning to the taxon in the NCBI NR/NT database"
    add_column :taxon_counts, :bpm, :float, comment: "Number of bases aligning to the taxon in the NCBI NR/NT database, per million bases sequenced"

    add_column :contigs, :base_count, :integer, comment: "Number of bases in the contig"
    add_index :contigs, [:pipeline_run_id, :base_count]
  end
end
