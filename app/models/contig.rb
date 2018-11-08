class Contig < ApplicationRecord
  belongs_to :pipeline_run
  def to_fa
    ">#{name}:#{read_count}\n#{sequence}"
  end
end
