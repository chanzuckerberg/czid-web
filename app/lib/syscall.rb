require 'open3'

class Syscall
  #
  # Returns stdout on success, false on failure, nil on error
  # Each argument of the command should be a separate variable, e.g.
  #  Syscall.run("ls", "-a)
  #
  def self.run(*cmd)
    stdout, stderr, status = Open3.capture3(*cmd)
    if status.success?
      return stdout
    elsif stderr
      Rails.logger.error("Syscall.run failed with command: #{cmd.join(' ')}. Error: #{stderr}")
    end

    return nil
  rescue StandardError => e
    Rails.logger.error("Syscall.run failed with command: #{cmd.join(' ')}")
    Rails.logger.error(e)

    return nil
  end

  #
  # Returns stdout on success, false on failure, nil on error
  # The first argument is the directory in which to run the command, and each argument
  # of the command should be a separate variable, e.g.
  #  Syscall.run_in_dir("/app", "ls", "-a")
  #
  def self.run_in_dir(dir, *cmd)
    stdout, stderr, status = Open3.capture3(*cmd, chdir: dir)
    if status.success?
      return stdout
    elsif stderr
      Rails.logger.error("Syscall.run_in_dir failed with command: #{cmd.join(' ')}. Error: #{stderr}")
    end

    return nil
  rescue StandardError => e
    Rails.logger.error("Syscall.run_in_dir failed with command: #{cmd.join(' ')}")
    Rails.logger.error(e)

    return nil
  end

  #
  # Returns stdout on success, nil on error
  # Call sequentially piped commands by passing in arrays of commands, e.g.
  #  Syscall.pipe_with_output(["echo", "hi"], ["grep", "-i", "Hi"]) ==> "hi\n"
  #
  # Note that if a command in the pipeline exits with an error, the stderr is NOT captured or logged.
  def self.pipe_with_output(*cmd)
    output = ""
    Open3.pipeline_r(*cmd) { |line, _ts| output += line.read }
    output
  rescue StandardError => e
    Rails.logger.error("Syscall.pipe_with_output failed with command: #{cmd.join(' ')}")
    Rails.logger.error(e)

    return nil
  end

  def self.s3_cp(source_s3_path, destination_s3_path)
    run("aws", "s3", "cp", source_s3_path, destination_s3_path)
  end

  def self.s3_mv_recursive(source_s3_path, destination_s3_path)
    run("aws", "s3", "mv", "--recursive", source_s3_path, destination_s3_path)
  end

  # See also S3Util::s3_select_json
  def self.s3_read_json(path)
    raw = s3_cp(path, "-")
    JSON.parse(raw)
  end

  def self.pipe(*cmd)
    err_read, err_write = IO.pipe

    # Run the piped commands and save stderr
    cmd_statuses = Open3.pipeline(*cmd, err: err_write)
    err_write.close
    stderr = err_read.read

    # Check whether the commands all succeeded.
    success = cmd_statuses.all? { |p| p && p.exitstatus && p.exitstatus.zero? }

    return success, stderr
  end
end
