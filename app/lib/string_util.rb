class StringUtil
  FILE_SIZE_UNITS = ["B", "KB", "MB", "GB", "TB"].freeze
  FILE_SIZE_UNIT_FACTOR = 1024.0
  def self.human_readable_file_size(size, decimal_places: 1)
    if size.nil?
      return nil
    end

    file_unit_index = 0
    file_size = size

    while file_unit_index < FILE_SIZE_UNITS.length - 1 && file_size >= FILE_SIZE_UNIT_FACTOR
      file_size /= FILE_SIZE_UNIT_FACTOR
      file_unit_index += 1
    end

    formatted_file_size = ActiveSupport::NumberHelper.number_to_rounded(
      file_size, precision: decimal_places, strip_insignificant_zeros: true
    )
    return "#{formatted_file_size} #{FILE_SIZE_UNITS[file_unit_index]}"
  end
end
