FactoryBot.define do
  factory :host_genome, class: HostGenome do
    transient do
      metadata_fields { [] }
    end
    sequence(:name) { |n| "Host #{n}" }
    # Use an admin user by default to reflect current reality. All host genomes
    # up to this point have been created by admins.
    association :user, factory: [:admin]

    after :create do |_host_genome, options|
      options.metadata_fields.each do |metadata_field_name|
        metadata_field = MetadataField.find_by(name: metadata_field_name)
        unless metadata_field
          create(:metadata_field, name: metadata_field_name)
        end
      end
    end
  end
end
