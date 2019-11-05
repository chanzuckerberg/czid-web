class ArrayUtil
  # Zip/interpolate two arrays. #1 from A, #1 from B, #2 from A, #2 from B...
  # If one list is longer than the other, extra entries will be appended to the
  # end of the combined list.
  def self.merge_arrays(list_a, list_b)
    # Pad 'a' if 'b' is longer. Not needed if 'a' is longer.
    if list_b.size > list_a.size
      diff = list_b.size - list_a.size
      list_a += [nil] * diff
    end
    list_a.zip(list_b).flatten.compact
  end
end
