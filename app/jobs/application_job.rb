# This is necessary for InstrumentedJob to be loaded before it is referenced in /jobs/*:
require "instrumented_job"

class ApplicationJob < ActiveJob::Base
end
