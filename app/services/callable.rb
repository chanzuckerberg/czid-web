module Callable
  extend ActiveSupport::Concern
  class_methods do
    def call(*args, **kwargs)
      new(*args, **kwargs).call
    end
  end
end
