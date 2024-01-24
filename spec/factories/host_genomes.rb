FactoryBot.define do
  factory :host_genome, class: HostGenome do
    s3_minimap2_dna_index_path { "s3://s3_minimap2_dna_index_path" }
    s3_minimap2_rna_index_path { "s3://s3_minimap2_rna_index_path" }

    transient do
      metadata_fields { [] }
    end
    sequence(:name) { |n| "Host #{n}" }
    # Only null-user host genomes are shown as options for new samples.
    user { nil }
    deprecation_status { nil }
    version { 1 }

    after :create do |host_genome, options|
      options.metadata_fields.each do |metadata_field_name|
        metadata_field = MetadataField.find_by(name: metadata_field_name)
        metadata_field ||= create(:metadata_field, name: metadata_field_name)
        host_genome.metadata_fields << metadata_field unless host_genome.metadata_fields.include?(metadata_field)
      end
    end
  end
end
