class Contig < ApplicationRecord
  # Contigs assembled from non_host reads
  belongs_to :pipeline_run

  validates :read_count, numericality: { greater_than_or_equal_to: 0 }, if: :mass_validation_enabled?
  validates :sequence, presence: true, if: :mass_validation_enabled?
  validates :lineage_json, presence: true, if: :mass_validation_enabled?

  def to_fa
    ">#{name}:#{read_count}:#{lineage_json}\n#{sequence}"
  end
end
