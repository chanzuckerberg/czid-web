require 'open3'

class Syscall
  #
  # Returns stdout on success, false on failure, nil on error
  # Each argument of the command should be a separate variable, e.g.
  #  Syscall.run("ls", "-a)
  #
  def self.run(*cmd)
    stdout, _stderr, status = Open3.capture3(*cmd)
    status.success? && stdout.slice!(0..-(1 + $INPUT_RECORD_SEPARATOR.size)) # strip trailing eol
  rescue
    return nil
  end

  #
  # Returns stdout on success, false on failure, nil on error
  # The first argument is the directory in which to run the command, and each argument
  # of the command should be a separate variable, e.g.
  #  Syscall.run_in_dir("/app", "ls", "-a)
  #
  def self.run_in_dir(dir, *cmd)
    stdout, _stderr, status = Open3.capture3(*cmd, chdir: dir)
    status.success? && stdout.slice!(0..-(1 + $INPUT_RECORD_SEPARATOR.size)) # strip trailing eol
  rescue
    return nil
  end

  #
  # Returns stdout on success, nil on error
  # Call sequentially piped commands by passing in arrays of commands, e.g.
  #  Syscall.pipe(["echo", "hi"], ["grep", "-i", "Hi"]) ==> "hi\n"
  #
  def self.pipe(*cmd)
    output = ""
    Open3.pipeline_r(*cmd) { |line, _ts| output += line.read }
    output
  rescue
    return nil
  end

  def self.s3_rm(s3_path)
    run("aws", "s3", "rm", s3_path)
  end

  def self.s3_cp(source_s3_path, destination_s3_path)
    run("aws", "s3", "cp", source_s3_path, destination_s3_path)
  end
end
