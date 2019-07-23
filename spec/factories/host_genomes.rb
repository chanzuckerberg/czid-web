FactoryBot.define do
  factory :host_genome, class: HostGenome do
    transient do
      metadata_fields { [] }
    end
    sequence(:name) { |n| "Host #{n}" }

    after :create do |host_genome, options|
      options.metadata_fields.each do |metadata_field_name|
        metadata_field = MetadataField.find_by(name: metadata_field_name)
        unless metadata_field
          metadata_field = create(:metadata_field, name: metadata_field_name)
        end

        # Add the metadata field to the host genome if it doesn't already exist.
        host_genome.metadata_fields << metadata_field unless host_genome.metadata_field_ids.include?(metadata_field.id)
      end
    end
  end
end
