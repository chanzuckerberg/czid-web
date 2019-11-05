require 'rubygems/package'

class S3TarWriter
  def initialize(s3_dest_url)
    @s3_dest_url = s3_dest_url
    @total_size_processed = 0
  end

  def start_streaming
    @stdin, _stdout, @wait_thr = Open3.popen2("aws", "s3", "cp", "-", @s3_dest_url)
    # Set stdin to binary mode, since GzipWriter outputs binary.
    @stdin.binmode
    @gz = Zlib::GzipWriter.new(@stdin)
    @tar = Gem::Package::TarWriter.new(@gz)
  end

  def add_file_with_data(file_path, data)
    # 600 is the default permission the file will have. Readable/writable by owner only.
    @tar.add_file_simple(file_path, 0o600, data.length) do |io|
      io.write(data)
    end
    @total_size_processed += data.length
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

  attr_reader :total_size_processed
end
