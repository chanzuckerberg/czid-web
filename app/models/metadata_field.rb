class MetadataField < ApplicationRecord
  has_and_belongs_to_many :host_genomes
  has_and_belongs_to_many :projects
end
