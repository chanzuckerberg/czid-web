module DateHelper
  # Ruby's strptime is too lenient, and will accept 2001-01-foobar and just parse out 2001-01.
  # We match against regex first, then use strptime
  DATE_STANDARD = {
    format: "%Y-%m-%d",
    regex: /(^\d{4}-\d{1,2}-\d{1,2}$)/
  }.freeze

  DATE_STANDARD_MONTH = {
    format: "%Y-%m",
    regex: /(^\d{4}-\d{1,2}$)/
  }.freeze

  DATE_ALT = {
    format: "%m/%d/%y",
    regex: %r{^\d{1,2}\/\d{1,2}\/\d{2}$}
  }.freeze

  DATE_ALT_MONTH = {
    format: "%m/%Y",
    regex: %r{^\d{1,2}\/\d{4}$}
  }.freeze

  def parse_date(date_string, allow_day = true)
    allowed_formats =
      if allow_day
        [DATE_STANDARD, DATE_STANDARD_MONTH, DATE_ALT, DATE_ALT_MONTH]
      else
        [DATE_STANDARD_MONTH, DATE_ALT_MONTH]
      end

    allowed_formats.each do |date_obj|
      date = parse_date_helper(date_string, date_obj)

      if date
        return date
      end
    end

    # If nothing worked, raise an error.
    raise ArgumentError, "Date could not be parsed"
  end

  def parse_date_helper(date_string, date_obj)
    unless date_obj[:regex].match(date_string)
      return nil
    end

    Date.strptime(date_string, date_obj[:format])
  rescue ArgumentError
    nil
  end
end
