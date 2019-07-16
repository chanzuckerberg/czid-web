module Callable
  extend ActiveSupport::Concern
  class_methods do
    def call(*args)
      new(*args).call
    end
  end
end
