class Contig < ApplicationRecord
  # Contigs assembled from non_host reads
  belongs_to :pipeline_run
  validates :pipeline_run, presence: true

  validates :read_count, numericality: { greater_than_or_equal_to: 0 }

  def to_fa
    ">#{name}:#{read_count}:#{lineage_json}\n#{sequence}"
  end
end
