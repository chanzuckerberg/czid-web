module UserMacros
  def create_users
    before do
      @admin = FactoryBot.create(:admin, role: 1)
      @joe = FactoryBot.create(:joe)
    end
  end

  def sign_in_by_symbol(user)
    before do
      @user = instance_variable_get("@#{user}".to_s)
      sign_in @user
    end
  end

  def with_signed_in_users(*users)
    # users requested must have been created before hand
    users.each do |user|
      sign_in_by_symbol user
      yield user
    end
  end
end
