module Types
  class AppConfigType < Types::BaseObject
    def self.authorized?(_object, context)
      current_user = context.current_user
      current_user.admin?
    end

    field :key, String, null: false
    field :value, String, null: false
  end
end
