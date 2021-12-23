FactoryBot.define do
  factory :host_genome, class: HostGenome do
    transient do
      metadata_fields { [] }
    end
    sequence(:name) { |n| "Host #{n}" }
    # Only null-user host genomes are shown as options for new samples.
    user { nil }

    after :create do |host_genome, options|
      options.metadata_fields.each do |metadata_field_name|
        metadata_field = MetadataField.find_by(name: metadata_field_name)
        metadata_field ||= create(:metadata_field, name: metadata_field_name)
        host_genome.metadata_fields << metadata_field unless host_genome.metadata_fields.include?(metadata_field)
      end
    end
  end
end
