class CreateAccessionCoverageStats < ActiveRecord::Migration[6.1]
  def change
    create_table :accession_coverage_stats do |t|
      t.bigint :pipeline_run_id, null: false, comment: "The id of the pipeline run the coverage stats were generated from"
      t.string :accession_id, null: false, comment: "The NCBI GenBank id of the accession the coverage stats were created for"
      t.string :accession_name, null: false, comment: "The NCBI GenBank name of the accession the coverage stats were created for"
      t.integer :taxid, null: false, comment: "The id of the taxon the accession belongs to"
      t.integer :num_contigs, null: false, comment: "Number of contigs for which this accession was the best match"
      t.integer :num_reads, null: false, comment: "Number of reads for which this accession was the best match"
      t.integer :score, null: false, comment: "max_contig_length + total_contig_length + num_reads, used to score top accessions"
      t.float :coverage_breadth, null: false, comment: "The percentage of the accession that is covered by at least one read or contig"
      t.float :coverage_depth, null: false, comment: "The average read depth of aligned contigs and reads over the length of the accession"

      t.index ["pipeline_run_id", "accession_id"], name: 'index_accession_coverage_stats_on_pr_id_and_accession_id'

      t.timestamps
    end
  end

  def down
    drop_table :accession_coverage_stats
  end
end
