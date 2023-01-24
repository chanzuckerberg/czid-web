module ParameterSanitization
  include Types

  def sanitize_order_by(model, order_by, default = nil)
    return model.column_names.include?(order_by) ? order_by : default
  end

  def sanitize_order_dir(order_dir, default = nil)
    sanitized_order_dir = (order_dir || "").downcase.to_sym
    if [:desc, :asc].include?(sanitized_order_dir)
      return sanitized_order_dir
    end

    return default
  end

  def sanitize_metadata_field_name(name, default = nil)
    return MetadataField.where(name: name).exists? ? name : default
  end

  def sanitize_title_name(title)
    # Allow letters, numbers, underscores, dashes, and spaces
    return title.gsub(/[^A-Za-z0-9_\- ]/, ' ').strip
  end

  def sanitize_accession_id(accession_id)
    if accession_id
      # Allow capital letters, numbers, underscores, and periods
      return accession_id.gsub(/[^A-Z0-9_\.]/, '')
    end
  end

  def sanitize_annotation_filters(annotation_filters)
    if annotation_filters
      return annotation_filters.select do |a|
        Annotation.contents.key?(get_annotation_name(a))
      end.map do |a|
        Annotation.contents[get_annotation_name(a)]
      end
    end
  end

  def get_annotation_name(annotation_filter)
    if annotation_filter.is_a?(String)
      JSON.parse(annotation_filter)["name"].downcase.parameterize(separator: '_')
    else
      annotation_filter.name.downcase.parameterize(separator: '_') || null
    end
  end
end
