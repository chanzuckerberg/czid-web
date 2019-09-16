require 'parallel'
require 'open3'

def foo(b)
    o, e, s = Open3.capture3("echo", b)
    o
end


a = Parallel.map(["1", "2", "3"], in_threads: 10) { |b|
    foo(b)
}

puts a