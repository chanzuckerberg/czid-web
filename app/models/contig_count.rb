class ContigCount < ApplicationRecord
  # Contig read count associated with a particular taxid, '*' means unassembled reads
  belongs_to :pipeline_run
end
