# remove any GSNAPL machine IPs that have been terminated and rerun the jobs they had on them
require 'logger'
require 'resque/plugins/lock'
class CheckGsnaplMachines
  extend Resque::Plugins::Lock
  @queue = :q03_pipeline_run
  @logger = Logger.new(STDOUT)
  def self.perform
    @logger.info("Checking on GSNAPL machines")
    GsnaplMachine.each do |m|
      @logger.info("  Checking GSNAPL machine #{m.id}")
      m.clean
    end
  end
end
