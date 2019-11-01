require 'rubygems/package'

class S3TarWriter
  def initialize(s3_dest_url)
    @s3_dest_url = s3_dest_url
  end

  def start_streaming
    @stdin, _stdout, @wait_thr = Open3.popen2("aws", "s3", "cp", "-", @s3_dest_url)
    # Set stdin to binary mode, since GzipWriter outputs binary.
    @stdin.binmode
    @gz = Zlib::GzipWriter.new(@stdin)
    @tar = Gem::Package::TarWriter.new(@gz)
  end

  def add_file_with_data(file_path, data)
    @tar.add_file_simple(file_path, 0o444, data.length) do |io|
      io.write(data)
    end
  end

  def close
    @tar.close
    @gz.close
    @stdin.close
  end

  # Waits for the aws s3 cp process to terminate.
  def process_status
    @wait_thr.value
  end
end
