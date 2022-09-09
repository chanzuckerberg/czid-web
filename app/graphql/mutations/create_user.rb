class Mutations::CreateUser < Mutations::BaseMutation
  field :email, String, null: true
  field :name, String, null: true
  field :institution, String, null: true
  field :archetypes, String, null: true
  field :segments, String, null: true
  field :role, Int, null: true
  field :sendActivation, Boolean, null: true

  def self.authorized?(object, context)
    super && current_user_is_admin?(context)
  end

  def resolve(email:, name:, institution:, archetypes:, segments:, send_activation:, role:)
    current_user = context[:current_user]
    @user = UserFactoryService.call(
      current_user: current_user,
      created_by_user_id: current_user.id,
      email: email,
      name: name,
      institution: institution,
      archetypes: archetypes,
      segments: segments,
      role: role,
      send_activation: send_activation
    )
  end
end
