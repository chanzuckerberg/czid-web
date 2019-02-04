require 'csv'

module MetadataHelper
  def official_metadata_fields_helper
    required = MetadataField.where(is_required: true)
    default = MetadataField.where(is_default: true)
    core = MetadataField.where(is_core: true)

    (required | default | core).map(&:field_info)
  end

  # TODO(mark): Generate more realistic default values.
  def generate_metadata_default_value(host_genome, field)
    unless host_genome.metadata_fields.include?(field)
      return nil
    end

    if field.base_type == Metadatum::STRING_TYPE
      if field.options.present?
        options = JSON.parse(field.options)
        return options[Random.new.rand(options.length)]
      end

      return "Example " + field.display_name
    end

    if field.base_type == Metadatum::NUMBER_TYPE
      return Random.new.rand(100)
    end

    if field.base_type == Metadatum::DATE_TYPE
      return String(Time.zone.today)
    end
  end

  def metadata_template_csv_helper
    required = MetadataField.where(is_required: true)
    default = MetadataField.where(is_default: true)

    fields = (required | default)

    field_names = ["sample_name"] + fields.pluck(:display_name)

    host_genomes = HostGenome.all.reject { |x| x.metadata_fields.empty? }

    CSV.generate(headers: true) do |csv|
      csv << field_names
      host_genomes.each do |host_genome|
        default_values = fields.map do |field|
          generate_metadata_default_value(host_genome, field)
        end

        row_name = "Example " + host_genome.name + " Sample"
        csv << [row_name] + default_values
      end
    end
  end
end
