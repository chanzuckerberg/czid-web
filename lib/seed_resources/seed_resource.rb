module Seedable
  extend ActiveSupport::Concern
  class_methods do
    def seed(*args, **kwargs)
      new(*args, **kwargs).seed
    end
  end
end

module SeedResource
  class Base
    include FactoryBot::Syntax::Methods
    include Seedable

    def seed
      raise NotImplementedError
    end
  end
end
