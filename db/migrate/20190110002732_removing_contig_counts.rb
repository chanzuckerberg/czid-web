class RemovingContigCounts < ActiveRecord::Migration[5.1]
  def change
    drop_table :contig_counts
    # Remove contigs with read count less than 4
    ActiveRecord::Base.connection.execute("DELETE FROM contigs where read_count < 4")
  end
end
