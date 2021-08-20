# Stores the coverage viz summary data for the top accession of a given taxon
# found in an mngs pipeline run.
# We score "best accessions" using max_contig_length + total_contig_length + num_reads.

# Coverage stats are generated in the Experimental stage as the output of
# GenerateCoverageViz step, starting in mngs pipeline version 3.2.0.

# We store these values in the db for mngs runs versions 6.0 and above.
# To access the stats for older pipeline runs, or for lower-scoring accessions,
# check the run's coverage_viz_summary file in s3.

class AccessionCoverageStat < ApplicationRecord
  belongs_to :pipeline_run

  validates :accession_id, presence: true
  validates :accession_name, presence: true
  validates :taxid, presence: true
  validates :num_contigs, numericality: { greater_than_or_equal_to: 0 }
  validates :num_reads, numericality: { greater_than_or_equal_to: 0 }
  validates :score, numericality: { greater_than_or_equal_to: 0 }
  validates :coverage_breadth, numericality: { greater_than_or_equal_to: 0 }
  validates :coverage_depth, numericality: { greater_than_or_equal_to: 0 }
end
