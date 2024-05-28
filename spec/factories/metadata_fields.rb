FactoryBot.define do
  factory :metadata_field, class: MetadataField do
    sequence(:name) { |n| "metadata_field_#{n}" }
    sequence(:display_name) { |n| "Metadata field #{n}" }
    base_type { 0 }

    # Note about associating host genomes
    # :metadata_field has_and_belongs_to_many :host_genomes, so you can pass and array of host genomes in the host_genomes
    # attrbute.  However, note that if the metadata fields has default_for_new_host_genome = 1, the field is automatically
    # associated with all host genomes, and specify the host_genomes attribute will cause a duplicate entry error
  end
end
