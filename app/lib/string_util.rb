class StringUtil
  def self.human_readable_file_size(size, decimal_places: 1)
    file_unit = ""
    file_size = size

    ["B", "KiB", "MiB", "GiB", "TiB"].each do |unit|
      file_unit = unit
      if file_size < 1024.0
        break
      end
      file_size /= 1024.0
    end
    return format("%3.#{decimal_places}f#{file_unit}", file_size)
  end
end
