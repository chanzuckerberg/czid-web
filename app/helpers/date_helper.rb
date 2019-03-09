module DateHelper
  def parse_date(date_string)
    # YYYY-MM-DD, YYYY-MM, MM/DD/YY, MM/YYYY
    # %Y-%m-%d must come before %Y-%m because %Y-%m will parse 2018-01-01 and throw away the day,
    # so we need to parse %Y-%m-%d first.
    ["%Y-%m-%d", "%Y-%m", "%m/%d/%y", "%m/%Y"].each do |format|
      date = parse_date_helper(date_string, format)

      if date
        return date
      end
    end

    # If nothing worked, raise an error.
    raise ArgumentError, "Date could not be parsed"
  end

  def parse_date_helper(date_string, date_format)
    Date.strptime(date_string, date_format)
  rescue
    nil
  end
end
