class HashUtil
  # example: turn    { :a => { :b => { :c => 1,
  #                                    :d => 2 },
  #                            :e => 3 },
  #                    :f => 4 }
  # into    {[:a, :b, :c] => 1, [:a, :b, :d] => 2, [:a, :e] => 3, [:f] => 4}
  def self.flat_hash(h, f = [], g = {})
    return g.update(f => h) unless h.is_a? Hash

    h.each { |k, r| flat_hash(r, f + [k], g) }
    g
  end
end
