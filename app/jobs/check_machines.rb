# remove any entries for machines that have been terminated
require 'logger'
require 'resque/plugins/lock'
class CheckMachines
  extend Resque::Plugins::Lock
  @queue = :q03_pipeline_run
  @logger = Logger.new(STDOUT)
  def self.perform
    @logger.info("Checking on GSNAPL/RAPSearch2 machines")
    Machine.each do |m|
      @logger.info("  Checking machine #{m.id}")
      m.clean
    end
  end
end
