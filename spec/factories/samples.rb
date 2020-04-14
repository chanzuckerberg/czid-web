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
    pipeline_execution_strategy { PipelineRun.directed_acyclic_graph }

    status { Sample::STATUS_CREATED }
    association :user

    # metadata fields
    # ensure the metadata field is added to the host genome
    before(:create) do |sample, options|
      options.metadata_fields.each_key do |metadata_field_name|
        metadata_field = MetadataField.find_by(name: metadata_field_name)
        unless metadata_field
          metadata_field = create(:metadata_field, name: metadata_field_name)
        end
        host_genome = sample.host_genome
        host_genome.metadata_fields << metadata_field unless host_genome.metadata_fields.include?(metadata_field)
      end
    end

    after :create do |sample, options|
      if MetadataField.table_exists?
        # Make sure the sample's host_genome has the requested metadata fields
        MetadataField.where(name: options.metadata_fields.keys()).each do |mf|
          unless sample.host_genome.metadata_fields.include?(mf)
            sample.host_genome.metadata_fields << mf
          end
        end
      end

      options.metadata_fields.each do |key, value|
        create(:metadatum, key: key, raw_value: value, sample: sample, metadata_field: MetadataField.find_by(name: key))
      end

      options.pipeline_runs_data.each do |pipeline_run_data|
        create(:pipeline_run, sample: sample, **pipeline_run_data)
      end
    end
  end
end
