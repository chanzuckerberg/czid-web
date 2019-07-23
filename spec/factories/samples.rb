FactoryBot.define do
  factory :sample do
    transient do
      # Hash of metadata_field_name => metadata_field_value to create for this sample
      metadata_fields { {} }
      # Host genome to load or create automatically for this sample.
      host_genome_name { nil }
      # Array of pipeline_runs entries to create.
      # The hash elements will be passed on to pipeline_run factory as keyword arguments.
      pipeline_runs_data { [] }
    end

    sequence(:name) { |n| "Sample #{n}" }
    input_files { build_list(:local_input_file, 2) }
    host_genome do
      if host_genome_name
        hg = HostGenome.find_by(name: host_genome_name)
        hg || build(:host_genome, name: host_genome_name)
      else
        build(:host_genome)
      end
    end

    # metadata fields
    # ensure the metadata field is added to the host genome
    before(:create) do |sample, options|
      options.metadata_fields.each_key do |metadata_field_name|
        unless MetadataField.exists?(name: metadata_field_name)
          metadata_field = create(:metadata_field, name: metadata_field_name, default_for_new_host_genome: 1)
          # This is needed to make metadata pass validation below
          sample.host_genome.metadata_fields << metadata_field
        end
      end
    end

    after :create do |sample, options|
      options.metadata_fields.each do |key, value|
        create(:metadatum, key: key, raw_value: value, sample: sample, metadata_field: MetadataField.find_by(name: key))
      end

      options.pipeline_runs_data.each do |pipeline_run_data|
        create(:pipeline_run, sample: sample, **pipeline_run_data)
      end
    end
  end
end
