module StringUtil
  # Humanize step name and remove "_out", "Run", and " Out"
  # e.g. "validate_input_out" -> "Validate Input"
  # && "runValidateInput" -> "Validate Input"
  # The carat "^" matches the beginning of a string, and
  # the dollar sign "$" the end of a string.
  def self.humanize_step_name(step_name)
    strip_regex = /(^Run )|(_out$)|( Out$)/
    return step_name.split("_").join(" ").titleize.gsub(strip_regex, "")
  end
end
