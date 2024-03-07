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

  # Merges two arrays and removes duplicates. Results are unsorted
  def self.merge_arrays_uniq(arr1, arr2)
    raise ArgumentError, "One or both input arguments are not of type Array" unless arr1.is_a?(Array) && arr2.is_a?(Array)

    return (arr1 + arr2).uniq
  end

  # Check if all elements of an array of strings are integers
  def self.all_integers?(arr)
    arr.all? { |str| str.to_i.to_s == str.to_s }
  end
end
