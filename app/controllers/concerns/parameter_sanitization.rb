module ParameterSanitization
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

  def sanitize_title_name(title)
    # Allow letters, numbers, underscores, dashes, and spaces
    return title.gsub(/[^A-Za-z0-9_\- ]/, ' ').strip
  end
end
